import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

type TargetType = 'TODO' | 'POST' | 'COMMENT';
type ReactionType = 'LIKE' | 'DISLIKE';

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** 반응 토글: 같은 타입이면 취소, 다른 타입이면 교체 */
  async toggle(
    userId: string,
    targetType: TargetType,
    targetId: string,
    type: ReactionType,
  ) {
    const where = this.buildWhere(userId, targetType, targetId);

    const existing = await this.prisma.reaction.findFirst({ where: { ...where, targetType } });

    if (existing) {
      if (existing.type === type) {
        await this.prisma.reaction.delete({ where: { id: existing.id } });
        return { action: 'removed', type };
      } else {
        await this.prisma.reaction.update({ where: { id: existing.id }, data: { type } });
        return { action: 'changed', type };
      }
    }

    await this.prisma.reaction.create({
      data: { userId, targetType, type, ...this.buildField(targetType, targetId) },
    });

    // 할일 좋아요 알림
    if (targetType === 'TODO' && type === 'LIKE') {
      try {
        const todo = await this.prisma.todo.findUnique({ where: { id: targetId }, select: { userId: true, title: true } });
        const reactor = await this.prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
        if (todo && reactor && todo.userId !== userId) {
          await this.notifications.send({
            userId: todo.userId,
            type: 'TODO_REACTION',
            title: `${reactor.nickname}님이 좋아요를 눌렀어요`,
            body: `"${todo.title.slice(0, 30)}"에 좋아요를 남겼습니다.`,
          });
        }
      } catch (e) {
        this.logger.error('Failed to send TODO_REACTION notification', e);
      }
    }

    return { action: 'added', type };
  }

  private buildWhere(userId: string, targetType: TargetType, targetId: string) {
    return { userId, ...this.buildField(targetType, targetId) };
  }

  private buildField(targetType: TargetType, targetId: string) {
    if (targetType === 'TODO') return { todoId: targetId };
    if (targetType === 'POST') return { postId: targetId };
    return { commentId: targetId };
  }
}
