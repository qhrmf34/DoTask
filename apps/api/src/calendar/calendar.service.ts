import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getMonthData(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const todos = await this.prisma.todo.findMany({
      where: { userId, dueDate: { gte: start, lte: end } },
      select: { dueDate: true, isCompleted: true },
    });

    const map = new Map<string, { total: number; done: number }>();
    for (const t of todos) {
      if (!t.dueDate) continue;
      const key = t.dueDate.toISOString().split('T')[0];
      const existing = map.get(key) || { total: 0, done: 0 };
      existing.total++;
      if (t.isCompleted) existing.done++;
      map.set(key, existing);
    }

    return Array.from(map.entries()).map(([date, { total, done }]) => ({
      date,
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100 * 10) / 10 : 0,
    }));
  }

  async getMonthStats(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const todos = await this.prisma.todo.findMany({
      where: { userId, dueDate: { gte: start, lte: end } },
      select: { dueDate: true, isCompleted: true },
    });

    const monthMap = new Map<number, { total: number; done: number }>();
    for (const t of todos) {
      if (!t.dueDate) continue;
      const m = t.dueDate.getMonth() + 1;
      const existing = monthMap.get(m) || { total: 0, done: 0 };
      existing.total++;
      if (t.isCompleted) existing.done++;
      monthMap.set(m, existing);
    }

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const data = monthMap.get(m) || { total: 0, done: 0 };
      return { month: m, ...data, pct: data.total > 0 ? Math.round((data.done / data.total) * 100 * 10) / 10 : 0 };
    });
  }
}
