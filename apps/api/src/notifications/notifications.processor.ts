import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  constructor(private prisma: PrismaService) {}

  @Process('send')
  async handleSend(job: Job<SendNotificationDto>) {
    const { userId, type, title, body, data } = job.data;
    await this.prisma.notification.create({
      data: { userId, type, title, body, ...(data ? { data: data as Prisma.InputJsonObject } : {}) },
    });
    // TODO: push notification (FCM, etc.) if needed
  }
}
