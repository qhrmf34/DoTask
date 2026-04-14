import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

export interface SendNotificationDto {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private queue: Queue,
  ) {}

  /** 알림 큐에 추가 (비동기 처리) */
  async send(dto: SendNotificationDto) {
    await this.queue.add('send', dto);
  }

  /** 여러 유저에게 동시 발송 */
  async sendMany(dtos: SendNotificationDto[]) {
    const jobs = dtos.map((dto) => ({ name: 'send', data: dto }));
    await this.queue.addBulk(jobs);
  }

  /** 목록 조회 (cursor 기반 페이지네이션) */
  async getList(userId: string, cursor?: string, take = 20) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, take) : items;
    return {
      items: data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
