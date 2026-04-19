import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const CREW_SELECT = {
  id: true,
  name: true,
  description: true,
  emoji: true,
  themeColor: true,
  bannerImage: true,
  category: true,
  visibility: true,
  inviteCode: true,
  maxMembers: true,
  tags: true,
  rules: true,
  createdAt: true,
  _count: { select: { members: true } },
  members: {
    where: { role: 'OWNER' },
    take: 1,
    select: { user: { select: { id: true, nickname: true, profileImage: true } } },
  },
};

@Injectable()
export class CrewsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway)) private chatGateway: ChatGateway,
  ) {}

  async search(q?: string, cat?: string, sort = 'popular') {
    return this.prisma.crew.findMany({
      where: {
        isDeleted: false,
        visibility: { in: ['PUBLIC', 'PASSWORD'] },
        ...(cat ? { category: cat } : {}),
        ...(q ? { name: { contains: q } } : {}),
      },
      select: CREW_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getMemberTodos(requesterId: string, crewId: string, userId: string, date: string) {
    // Verify requester is in the crew
    const member = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId: requesterId } },
    });
    if (!member) throw new ForbiddenException('크루 멤버만 볼 수 있습니다.');

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.prisma.todo.findMany({
      where: { userId, dueDate: { gte: start, lte: end } },
      include: {
        category: true,
        _count: { select: { comments: true, reactions: true } },
        reactions: { select: { type: true, userId: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTodayStats(crewId: string) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const members = await this.prisma.crewMember.findMany({
      where: { crewId },
      include: { user: { select: { id: true, nickname: true, profileImage: true } } },
    });

    const stats = await Promise.all(
      members.map(async (m) => {
        const todos = await this.prisma.todo.findMany({
          where: { userId: m.userId, dueDate: { gte: start, lte: end } },
          select: { isCompleted: true },
        });
        const total = todos.length;
        const done = todos.filter((t) => t.isCompleted).length;
        return {
          userId: m.userId,
          nickname: m.user.nickname,
          profileImage: m.user.profileImage,
          role: m.role,
          done,
          total,
          pct: total === 0 ? 0 : Math.round((done / total) * 100),
        };
      }),
    );
    return stats;
  }

  async findMyCrews(userId: string) {
    const memberships = await this.prisma.crewMember.findMany({
      where: { userId, crew: { isDeleted: false } },
      include: { crew: { select: CREW_SELECT } },
    });
    return memberships.map((m) => m.crew);
  }

  async findOne(id: string) {
    const crew = await this.prisma.crew.findUnique({ where: { id, isDeleted: false }, select: CREW_SELECT });
    if (!crew) throw new NotFoundException();
    return crew;
  }

  async create(userId: string, data: any, bannerImage?: string) {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;
    return this.prisma.crew.create({
      data: {
        name: data.name,
        description: data.description,
        emoji: data.emoji || '🏠',
        themeColor: data.themeColor || '#7c6ff7',
        bannerImage,
        category: data.category,
        visibility: data.visibility || 'PUBLIC',
        passwordHash,
        maxMembers: data.maxMembers || 20,
        tags: data.tags || [],
        rules: data.rules,
        members: { create: { userId, role: 'OWNER' } },
        channels: {
          create: [
            { name: '일반', type: 'GENERAL', order: 0 },
            { name: '공지', type: 'NOTICE', order: 1 },
          ],
        },
      },
      select: CREW_SELECT,
    });
  }

  async update(userId: string, id: string, data: any) {
    await this.assertOwnerOrAdmin(userId, id);
    const { password, ...rest } = data;
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    return this.prisma.crew.update({
      where: { id },
      data: { ...rest, ...(passwordHash ? { passwordHash } : {}) },
      select: CREW_SELECT,
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    return this.prisma.crew.update({ where: { id }, data: { isDeleted: true } });
  }

  async join(userId: string, crewId: string, password?: string) {
    const crew = await this.prisma.crew.findUnique({ where: { id: crewId } });
    if (!crew || crew.isDeleted) throw new NotFoundException();

    const existing = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId } },
    });
    if (existing) throw new ConflictException('이미 가입된 크루입니다.');

    if (crew.visibility === 'PRIVATE') throw new ForbiddenException('초대 링크로만 가입할 수 있습니다.');
    if (crew.visibility === 'PASSWORD') {
      if (!password || !crew.passwordHash) throw new BadRequestException('비밀번호가 필요합니다.');
      const valid = await bcrypt.compare(password, crew.passwordHash);
      if (!valid) throw new ForbiddenException('비밀번호가 올바르지 않습니다.');
    }

    const member = await this.prisma.$transaction(async (tx) => {
      const count = await tx.crewMember.count({ where: { crewId } });
      if (count >= crew.maxMembers) throw new BadRequestException('크루 정원이 꽉 찼습니다.');
      return tx.crewMember.create({ data: { crewId, userId } });
    });
    this.sendJoinSystemMessage(crewId, userId);
    return member;
  }

  async joinByInvite(userId: string, inviteCode: string) {
    const crew = await this.prisma.crew.findUnique({ where: { inviteCode } });
    if (!crew || crew.isDeleted) throw new NotFoundException('유효하지 않은 초대 링크입니다.');

    const existing = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId: crew.id, userId } },
    });
    if (existing) throw new ConflictException('이미 가입된 크루입니다.');

    const member = await this.prisma.$transaction(async (tx) => {
      const count = await tx.crewMember.count({ where: { crewId: crew.id } });
      if (count >= crew.maxMembers) throw new BadRequestException('크루 정원이 꽉 찼습니다.');
      return tx.crewMember.create({ data: { crewId: crew.id, userId } });
    });
    this.sendJoinSystemMessage(crew.id, userId);
    return member;
  }

  async leave(userId: string, crewId: string) {
    const member = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId } },
    });
    if (!member) throw new NotFoundException();
    if (member.role === 'OWNER') throw new ForbiddenException('오너는 탈퇴할 수 없습니다.');
    return this.prisma.crewMember.delete({ where: { crewId_userId: { crewId, userId } } });
  }

  async getMembers(requesterId: string, crewId: string) {
    const membership = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId: requesterId } },
    });
    if (!membership) throw new ForbiddenException('크루 멤버만 볼 수 있습니다.');
    return this.prisma.crewMember.findMany({
      where: { crewId },
      include: { user: { select: { id: true, nickname: true, profileImage: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(requesterId: string, crewId: string, targetUserId: string, role: string) {
    await this.assertOwner(requesterId, crewId);
    return this.prisma.crewMember.update({
      where: { crewId_userId: { crewId, userId: targetUserId } },
      data: { role },
    });
  }

  async transferOwnership(requesterId: string, crewId: string, targetUserId: string) {
    await this.assertOwner(requesterId, crewId);
    const target = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('대상 멤버를 찾을 수 없습니다.');
    // 기존 오너 → ADMIN, 타겟 → OWNER
    await this.prisma.$transaction([
      this.prisma.crewMember.update({
        where: { crewId_userId: { crewId, userId: requesterId } },
        data: { role: 'ADMIN' },
      }),
      this.prisma.crewMember.update({
        where: { crewId_userId: { crewId, userId: targetUserId } },
        data: { role: 'OWNER' },
      }),
    ]);
    return { transferred: true };
  }

  async kickMember(requesterId: string, crewId: string, targetUserId: string) {
    await this.assertOwnerOrAdmin(requesterId, crewId);
    const target = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException();
    if (target.role === 'OWNER') throw new ForbiddenException();
    return this.prisma.crewMember.delete({ where: { crewId_userId: { crewId, userId: targetUserId } } });
  }

  async regenerateInviteCode(requesterId: string, crewId: string) {
    await this.assertOwner(requesterId, crewId);
    return this.prisma.crew.update({
      where: { id: crewId },
      data: { inviteCode: uuidv4() },
      select: { inviteCode: true },
    });
  }

  async findByInviteCode(inviteCode: string) {
    const crew = await this.prisma.crew.findUnique({ where: { inviteCode }, select: CREW_SELECT });
    if (!crew) throw new NotFoundException();
    return crew;
  }

  private async sendJoinSystemMessage(crewId: string, userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
      const generalChannel = await this.prisma.channel.findFirst({
        where: { crewId, type: 'GENERAL' },
        select: { id: true },
      });
      if (!generalChannel || !user) return;
      // userId 필수 제약으로 DB 저장 없이 소켓으로만 브로드캐스트
      const systemMsg = {
        id: `system-${Date.now()}`,
        channelId: generalChannel.id,
        content: `${user.nickname}님이 크루에 참여했습니다.`,
        type: 'SYSTEM',
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: null,
        user: null,
      };
      this.chatGateway.emitToChannel(generalChannel.id, 'chat:message', systemMsg);
    } catch {}
  }

  private async assertOwner(userId: string, crewId: string) {
    const m = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId } },
    });
    if (!m || m.role !== 'OWNER') throw new ForbiddenException();
  }

  private async assertOwnerOrAdmin(userId: string, crewId: string) {
    const m = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId } },
    });
    if (!m || !['OWNER', 'ADMIN'].includes(m.role)) throw new ForbiddenException();
  }
}
