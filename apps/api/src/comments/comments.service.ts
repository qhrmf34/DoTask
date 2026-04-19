import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const CMT_SELECT = {
  id: true, userId: true, targetType: true, todoId: true, postId: true,
  parentId: true, content: true, isDeleted: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, nickname: true, profileImage: true } },
  _count: { select: { reactions: true, replies: true } },
};

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  getTodoComments(todoId: string) {
    return this.prisma.comment.findMany({
      where: { todoId, parentId: null, isDeleted: false },
      select: { ...CMT_SELECT, replies: { where: { isDeleted: false }, select: CMT_SELECT, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  getPostComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null, isDeleted: false },
      select: { ...CMT_SELECT, replies: { where: { isDeleted: false }, select: CMT_SELECT, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createForTodo(userId: string, todoId: string, content: string, parentId?: string) {
    const comment = await this.prisma.comment.create({
      data: { userId, targetType: 'TODO', todoId, parentId, content },
      select: { ...CMT_SELECT, user: { select: { id: true, nickname: true, profileImage: true } } },
    });

    try {
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId }, select: { userId: true, title: true } });
      if (todo && todo.userId !== userId) {
        await this.notifications.send({
          userId: todo.userId,
          type: 'TODO_COMMENT',
          title: `${comment.user.nickname}님이 댓글을 달았어요`,
          body: `"${todo.title.slice(0, 30)}": ${content.slice(0, 40)}`,
        });
      }
    } catch (e) {
      this.logger.error('Failed to send TODO_COMMENT notification', e);
    }

    return comment;
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

  async remove(userId: string, id: string) {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.userId !== userId) {
      // 게시글 댓글이면 크루 어드민 권한 확인
      if (c.postId) {
        const post = await this.prisma.post.findUnique({ where: { id: c.postId }, select: { crewId: true } });
        if (!post) throw new ForbiddenException();
        const m = await this.prisma.crewMember.findUnique({
          where: { crewId_userId: { crewId: post.crewId, userId } },
        });
        if (!m || !['OWNER', 'ADMIN'].includes(m.role)) throw new ForbiddenException();
      } else {
        throw new ForbiddenException();
      }
    }
    return this.prisma.comment.update({ where: { id }, data: { isDeleted: true, content: '삭제된 댓글입니다.' } });
  }

  async report(reporterId: string, commentId: string, reason: string, detail?: string) {
    return this.prisma.report.create({ data: { reporterId, targetType: 'COMMENT', commentId, reason, detail } });
  }
}
