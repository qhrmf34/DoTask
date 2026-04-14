import { Injectable, NotFoundException } from '@nestjs/common';
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

    const [totalCompleted, monthTodos, crewCount] = await Promise.all([
      this.prisma.todo.count({ where: { userId, isCompleted: true } }),
      this.prisma.todo.findMany({
        where: { userId, dueDate: { gte: firstOfMonth, lte: lastOfMonth } },
        select: { isCompleted: true },
      }),
      this.prisma.crewMember.count({ where: { userId } }),
    ]);

    const monthTotal = monthTodos.length;
    const monthDone = monthTodos.filter((t) => t.isCompleted).length;
    const monthPct = monthTotal === 0 ? 0 : Math.round((monthDone / monthTotal) * 100);

    // Simple streak: consecutive days with at least one completed todo (going backwards from today)
    let streak = 0;
    const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 365; i++) {
      const start = new Date(checkDate);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      const count = await this.prisma.todo.count({
        where: { userId, isCompleted: true, completedAt: { gte: start, lte: end } },
      });
      if (count > 0) streak++;
      else break;
    }

    return { totalCompleted, monthPct, crewCount, streak };
  }
}
