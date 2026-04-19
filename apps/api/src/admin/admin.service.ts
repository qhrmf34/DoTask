import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ── 통계 ─────────────────────────────────────────────────────
  async getStats() {
    const [users, crews, posts, messages, reports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.crew.count({ where: { isDeleted: false } }),
      this.prisma.post.count({ where: { isDeleted: false } }),
      this.prisma.message.count({ where: { isDeleted: false } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    return { users, crews, posts, messages, pendingReports: reports };
  }

  // ── 유저 관리 ─────────────────────────────────────────────────
  async getUsers(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { OR: [{ nickname: { contains: search } }, { email: { contains: search } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, nickname: true, profileImage: true, role: true, isActive: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async toggleUserActive(adminId: string, targetId: string) {
    if (adminId === targetId) throw new ForbiddenException('Cannot deactivate yourself');
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException();
    return this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });
  }

  async deleteUser(adminId: string, targetId: string) {
    if (adminId === targetId) throw new ForbiddenException('Cannot delete yourself');
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException();
    await this.prisma.user.delete({ where: { id: targetId } });
    return { deleted: true };
  }

  // ── 크루 관리 ─────────────────────────────────────────────────
  async getCrews(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      isDeleted: false,
      ...(search ? { name: { contains: search } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.crew.findMany({
        where,
        skip,
        take: limit,
        orderBy: { members: { _count: 'desc' } },
        select: {
          id: true, name: true, description: true, emoji: true,
          themeColor: true, bannerImage: true, category: true,
          visibility: true, maxMembers: true, tags: true, createdAt: true,
          _count: { select: { members: true, posts: true, channels: true } },
        },
      }),
      this.prisma.crew.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getCrewPosts(crewId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { crewId, isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nickname: true, profileImage: true } },
          _count: { select: { comments: true, reactions: true, reports: true } },
        },
      }),
      this.prisma.post.count({ where: { crewId, isDeleted: false } }),
    ]);
    return { items, total, page, limit };
  }

  async getCrewMessages(crewId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { channel: { crewId }, isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nickname: true, profileImage: true } },
          channel: { select: { id: true, name: true } },
          _count: { select: { reports: true } },
        },
      }),
      this.prisma.message.count({ where: { channel: { crewId }, isDeleted: false } }),
    ]);
    return { items, total, page, limit };
  }

  async deleteCrew(crewId: string) {
    const crew = await this.prisma.crew.findUnique({ where: { id: crewId } });
    if (!crew) throw new NotFoundException();
    await this.prisma.crew.update({ where: { id: crewId }, data: { isDeleted: true } });
    return { deleted: true };
  }

  // ── 게시글 관리 ───────────────────────────────────────────────
  async getPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nickname: true } },
          crew: { select: { id: true, name: true } },
          _count: { select: { comments: true, reactions: true, reports: true } },
        },
      }),
      this.prisma.post.count({ where: { isDeleted: false } }),
    ]);
    return { items, total, page, limit };
  }

  async deletePost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    await this.prisma.post.update({ where: { id: postId }, data: { isDeleted: true } });
    return { deleted: true };
  }

  // ── 채팅 메시지 관리 ──────────────────────────────────────────
  async getMessages(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nickname: true } },
          channel: { select: { id: true, name: true, crewId: true } },
          _count: { select: { reports: true } },
        },
      }),
      this.prisma.message.count({ where: { isDeleted: false } }),
    ]);
    return { items, total, page, limit };
  }

  async deleteMessage(messageId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();
    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: '관리자에 의해 삭제된 메시지입니다.' },
    });
    return { deleted: true };
  }

  // ── 신고 관리 ─────────────────────────────────────────────────
  async getReports(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, nickname: true } },
          message: { select: { id: true, content: true, user: { select: { id: true, nickname: true } } } },
          post: { select: { id: true, content: true, user: { select: { id: true, nickname: true } } } },
          comment: { select: { id: true, content: true, user: { select: { id: true, nickname: true } } } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    // targetUserId가 있는 신고는 유저 정보 추가 조회
    const targetUserIds = items.filter((r) => r.targetUserId).map((r) => r.targetUserId as string);
    const targetUsers = targetUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: targetUserIds } },
          select: { id: true, nickname: true, isActive: true },
        })
      : [];
    const targetUserMap = Object.fromEntries(targetUsers.map((u) => [u.id, u]));

    const enriched = items.map((r) => ({
      ...r,
      targetUser: r.targetUserId ? targetUserMap[r.targetUserId] ?? null
        : r.message?.user ?? r.post?.user ?? r.comment?.user ?? null,
    }));

    return { items: enriched, total, page, limit };
  }

  async updateReportStatus(reportId: string, status: 'REVIEWED' | 'DISMISSED') {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException();
    return this.prisma.report.update({ where: { id: reportId }, data: { status } });
  }

  async notifyReporter(reportId: string, customMessage?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { reporterId: true, status: true },
    });
    if (!report) throw new NotFoundException();
    const body = customMessage?.trim()
      || (report.status === 'REVIEWED'
        ? '신고하신 내용이 검토되어 처리되었습니다.'
        : '신고하신 내용을 검토하였으나 처리 기준에 해당하지 않아 처리되지 않았습니다.');
    await this.notifications.send({
      userId: report.reporterId,
      type: 'REPORT_PROCESSED',
      title: '[관리자] 신고 처리 안내',
      body,
    });
    return { sent: true };
  }
}
