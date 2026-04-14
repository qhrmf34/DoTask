import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type TargetType = 'TODO' | 'POST' | 'COMMENT';
type ReactionType = 'LIKE' | 'DISLIKE';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

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
