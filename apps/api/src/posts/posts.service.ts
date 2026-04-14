import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
};

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async getByCrewId(crewId: string, cursor?: string) {
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
    return this.prisma.post.create({
      data: { crewId, userId, content, imageUrls },
      select: POST_SELECT,
    });
  }

  async update(userId: string, id: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.isDeleted) throw new NotFoundException();
    if (post.userId !== userId) throw new ForbiddenException();
    return this.prisma.post.update({ where: { id }, data: { content }, select: POST_SELECT });
  }

  async remove(userId: string, id: string, role: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException();
    if (post.userId !== userId && role !== 'ADMIN') throw new ForbiddenException();
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
