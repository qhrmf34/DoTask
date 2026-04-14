import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async getByCrewId(crewId: string) {
    const channels = await this.prisma.channel.findMany({
      where: { crewId },
      orderBy: { order: 'asc' },
    });

    // 각 채널의 마지막 메시지 병렬 조회
    const withLastMsg = await Promise.all(
      channels.map(async (ch) => {
        const last = await this.prisma.message.findFirst({
          where: { channelId: ch.id, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            type: true,
            createdAt: true,
            user: { select: { nickname: true } },
          },
        });
        return { ...ch, lastMessage: last ?? null };
      }),
    );

    return withLastMsg;
  }

  async create(userId: string, crewId: string, data: { name: string; type?: string; order?: number }) {
    await this.assertOwnerOrAdmin(userId, crewId);
    return this.prisma.channel.create({ data: { crewId, ...data } });
  }

  async update(userId: string, id: string, data: any) {
    const ch = await this.prisma.channel.findUnique({ where: { id } });
    if (!ch) throw new NotFoundException();
    await this.assertOwnerOrAdmin(userId, ch.crewId);
    return this.prisma.channel.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const ch = await this.prisma.channel.findUnique({ where: { id } });
    if (!ch) throw new NotFoundException();
    await this.assertOwnerOrAdmin(userId, ch.crewId);
    return this.prisma.channel.delete({ where: { id } });
  }

  private async assertOwnerOrAdmin(userId: string, crewId: string) {
    const m = await this.prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId } },
    });
    if (!m || !['OWNER', 'ADMIN'].includes(m.role)) throw new ForbiddenException();
  }
}
