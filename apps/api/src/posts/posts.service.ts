import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const POST_SELECT = {
  id: true,
  crewId: true,
  userId: true,
  content: true,
  imageUrls: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, nickname: true, profileImage: true } },
  _count: { select: { comments: true, reactions: true } },
  reactions: { select: { type: true, userId: true } },
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getByCrewId(userId: string, crewId: string, cursor?: string) {
    const membership = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId } },
    });
    if (!membership) throw new ForbiddenException('크루 멤버만 볼 수 있습니다.');
    const posts = await this.prisma.post.findMany({
      where: { crewId, isDeleted: false },
      select: POST_SELECT,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = posts.length > 20;
    const data = hasMore ? posts.slice(0, 20) : posts;
    return { data, nextCursor: hasMore ? data[data.length - 1].id : null, hasMore };
  }

  async create(userId: string, crewId: string, content: string, imageUrls: string[] = []) {
    const membership = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId } },
    });
    if (!membership) throw new ForbiddenException('크루 멤버만 게시글을 작성할 수 있습니다.');
    const post = await this.prisma.post.create({
      data: { crewId, userId, content, imageUrls },
      select: { ...POST_SELECT, user: { select: { id: true, nickname: true, profileImage: true } } },
    });

    // 크루 멤버들에게 알림 (작성자 제외)
    const members = await this.prisma.crewMember.findMany({
      where: { crewId, userId: { not: userId } },
      select: { userId: true },
    });
    const crew = await this.prisma.crew.findUnique({ where: { id: crewId }, select: { name: true } });
    if (members.length && crew) {
      await this.notifications.sendMany(
        members.map((m) => ({
          userId: m.userId,
          type: 'NEW_POST',
          title: `${crew.name} 새 게시글`,
          body: `${post.user.nickname}: ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`,
          data: { crewId, postId: post.id },
        })),
      );
    }

    return post;
  }

  async update(userId: string, id: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.isDeleted) throw new NotFoundException();
    if (post.userId !== userId) throw new ForbiddenException();
    return this.prisma.post.update({ where: { id }, data: { content }, select: POST_SELECT });
  }

  async remove(userId: string, id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException();
    if (post.userId !== userId) {
      await this.assertCrewAdmin(userId, post.crewId);
    }
    return this.prisma.post.update({ where: { id }, data: { isDeleted: true } });
  }

  async togglePin(requesterId: string, id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException();
    await this.assertCrewAdmin(requesterId, post.crewId);
    return this.prisma.post.update({ where: { id }, data: { isPinned: !post.isPinned }, select: { id: true, isPinned: true } });
  }

  async report(reporterId: string, postId: string, reason: string, detail?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    return this.prisma.report.create({ data: { reporterId, targetType: 'POST', postId, reason, detail } });
  }

  private async assertCrewAdmin(userId: string, crewId: string) {
    const m = await this.prisma.crewMember.findUnique({ where: { crewId_userId: { crewId, userId } } });
    if (!m || !['OWNER', 'ADMIN'].includes(m.role)) throw new ForbiddenException();
  }
}
