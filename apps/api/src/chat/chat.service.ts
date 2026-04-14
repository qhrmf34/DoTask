import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MESSAGE_SELECT = {
  id: true,
  channelId: true,
  userId: true,
  content: true,
  type: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  fileMimeType: true,
  isEdited: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, nickname: true, profileImage: true } },
};

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(channelId: string, cursor?: string, take = 50) {
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > take;
    const data = hasMore ? messages.slice(0, take) : messages;
    return {
      data: data.reverse(),
      nextCursor: hasMore ? data[0].id : null,
      hasMore,
    };
  }

  async createMessage(data: {
    channelId: string;
    userId: string;
    content: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
    metadata?: any;
  }) {
    return this.prisma.message.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        content: data.content,
        type: data.type || 'TEXT',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileMimeType: data.fileMimeType,
        metadata: data.metadata,
      },
      select: MESSAGE_SELECT,
    });
  }

  async updateMessage(userId: string, messageId: string, content: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.isDeleted) throw new NotFoundException('메시지를 찾을 수 없습니다.');
    if (msg.userId !== userId) throw new ForbiddenException('본인 메시지만 수정할 수 있습니다.');
    if (msg.type !== 'TEXT') throw new ForbiddenException('텍스트 메시지만 수정할 수 있습니다.');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      select: MESSAGE_SELECT,
    });
  }

  async deleteMessage(userId: string, messageId: string, userRole: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: { include: { crew: { include: { members: { where: { userId } } } } } } },
    });
    if (!msg) throw new NotFoundException();

    const isOwner = msg.userId === userId;
    const crewRole = msg.channel?.crew?.members?.[0]?.role;
    const canDelete = isOwner || userRole === 'ADMIN' || crewRole === 'OWNER' || crewRole === 'ADMIN';
    if (!canDelete) throw new ForbiddenException();

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: '삭제된 메시지입니다.' },
      select: MESSAGE_SELECT,
    });
  }

  async reportMessage(reporterId: string, messageId: string, reason: string, detail?: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();
    if (msg.userId === reporterId) throw new ForbiddenException('본인 메시지는 신고할 수 없습니다.');

    return this.prisma.report.create({
      data: { reporterId, targetType: 'MESSAGE', messageId, reason, detail },
    });
  }
}
