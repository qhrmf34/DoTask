import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  getByCrewId(crewId: string) {
    return this.prisma.channel.findMany({
      where: { crewId },
      orderBy: { order: 'asc' },
    });
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
