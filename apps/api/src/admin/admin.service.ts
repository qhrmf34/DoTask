import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
  async getUsers(page = 1, limit = 20, search?: string) {
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
  async getCrews(page = 1, limit = 20, search?: string) {
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
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { members: true, posts: true } } },
      }),
      this.prisma.crew.count({ where }),
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
  async getPosts(page = 1, limit = 20) {
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
  async getReports(page = 1, limit = 20, status?: string) {
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
          message: { select: { id: true, content: true } },
          post: { select: { id: true, content: true } },
          comment: { select: { id: true, content: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async updateReportStatus(reportId: string, status: 'REVIEWED' | 'DISMISSED') {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException();
    return this.prisma.report.update({ where: { id: reportId }, data: { status } });
  }
}
