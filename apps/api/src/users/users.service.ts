import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, nickname: true, profileImage: true,
        bio: true, provider: true, role: true, createdAt: true,
        _count: { select: { crewMembers: true } },
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async updateMe(userId: string, data: { nickname?: string; bio?: string }) {
    if (data.nickname !== undefined) {
      const trimmed = data.nickname.trim();
      if (trimmed.length < 2 || trimmed.length > 16) {
        throw new BadRequestException('닉네임은 2~16자여야 합니다.');
      }
      data = { ...data, nickname: trimmed };
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, nickname: true, profileImage: true, bio: true,
      },
    });
  }

  async updateAvatar(userId: string, profileImage: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage },
      select: { id: true, profileImage: true },
    });
  }

  async deleteAvatar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
      select: { id: true },
    });
  }

  async deleteMe(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  async getStats(userId: string) {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0);

    const [totalCompleted, monthTodos, crewCount, recentCompleted] = await Promise.all([
      this.prisma.todo.count({ where: { userId, isCompleted: true } }),
      this.prisma.todo.findMany({
        where: { userId, dueDate: { gte: firstOfMonth, lte: lastOfMonth } },
        select: { isCompleted: true },
      }),
      this.prisma.crewMember.count({ where: { userId } }),
      this.prisma.todo.findMany({
        where: { userId, isCompleted: true, completedAt: { gte: oneYearAgo } },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    const monthTotal = monthTodos.length;
    const monthDone = monthTodos.filter((t) => t.isCompleted).length;
    const monthPct = monthTotal === 0 ? 0 : Math.round((monthDone / monthTotal) * 100);

    // 완료된 날짜 Set으로 스트릭 계산 (DB 쿼리 1회)
    const completedDateSet = new Set(
      recentCompleted
        .filter((t) => t.completedAt)
        .map((t) => {
          const d = new Date(t.completedAt!);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }),
    );
    let streak = 0;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (completedDateSet.has(key)) streak++;
      else break;
    }

    return { totalCompleted, monthPct, crewCount, streak };
  }

  async reportUser(reporterId: string, targetUserId: string, reason: string, detail?: string) {
    if (reporterId === targetUserId) throw new ForbiddenException('본인을 신고할 수 없습니다.');
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException();
    return this.prisma.report.create({
      data: { reporterId, targetType: 'USER', targetUserId, reason, detail },
    });
  }
}
