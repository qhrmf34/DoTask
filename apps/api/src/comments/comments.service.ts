import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CMT_SELECT = {
  id: true, userId: true, targetType: true, todoId: true, postId: true,
  parentId: true, content: true, isDeleted: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, nickname: true, profileImage: true } },
  _count: { select: { reactions: true, replies: true } },
};

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  getTodoComments(todoId: string) {
    return this.prisma.comment.findMany({
      where: { todoId, parentId: null },
      select: { ...CMT_SELECT, replies: { select: CMT_SELECT, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  getPostComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      select: { ...CMT_SELECT, replies: { select: CMT_SELECT, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  createForTodo(userId: string, todoId: string, content: string, parentId?: string) {
    return this.prisma.comment.create({
      data: { userId, targetType: 'TODO', todoId, parentId, content },
      select: CMT_SELECT,
    });
  }

  createForPost(userId: string, postId: string, content: string, parentId?: string) {
    return this.prisma.comment.create({
      data: { userId, targetType: 'POST', postId, parentId, content },
      select: CMT_SELECT,
    });
  }

  async update(userId: string, id: string, content: string) {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c || c.isDeleted) throw new NotFoundException();
    if (c.userId !== userId) throw new ForbiddenException();
    return this.prisma.comment.update({ where: { id }, data: { content }, select: CMT_SELECT });
  }

  async remove(userId: string, id: string, role: string) {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.userId !== userId && role !== 'ADMIN') throw new ForbiddenException();
    return this.prisma.comment.update({ where: { id }, data: { isDeleted: true, content: '삭제된 댓글입니다.' } });
  }

  async report(reporterId: string, commentId: string, reason: string, detail?: string) {
    return this.prisma.report.create({ data: { reporterId, targetType: 'COMMENT', commentId, reason, detail } });
  }
}
