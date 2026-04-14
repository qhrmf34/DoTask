import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async findByDate(userId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.prisma.todo.findMany({
      where: {
        userId,
        dueDate: { gte: start, lte: end },
      },
      include: {
        category: true,
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: { ...dto, userId, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
      include: { category: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateTodoDto) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) throw new NotFoundException('할일을 찾을 수 없습니다.');
    if (todo.userId !== userId) throw new ForbiddenException();

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { category: true },
    });
  }

  async toggleComplete(userId: string, id: string) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) throw new NotFoundException();
    if (todo.userId !== userId) throw new ForbiddenException();

    return this.prisma.todo.update({
      where: { id },
      data: {
        isCompleted: !todo.isCompleted,
        completedAt: !todo.isCompleted ? new Date() : null,
      },
    });
  }

  async remove(userId: string, id: string) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) throw new NotFoundException();
    if (todo.userId !== userId) throw new ForbiddenException();

    return this.prisma.todo.delete({ where: { id } });
  }

  async getMonthlyStats(userId: string, year: number, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    const todos = await this.prisma.todo.findMany({
      where: { userId, dueDate: { gte: start, lte: end } },
      select: { dueDate: true, isCompleted: true },
    });

    // 하루별로 그룹핑
    const dayMap = new Map<string, { total: number; completed: number }>();
    for (const todo of todos) {
      if (!todo.dueDate) continue;
      const d = todo.dueDate;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const cur = dayMap.get(key) ?? { total: 0, completed: 0 };
      dayMap.set(key, { total: cur.total + 1, completed: cur.completed + (todo.isCompleted ? 1 : 0) });
    }

    // 하루하루 달성률 합산 / 월 전체 일수
    let rateSum = 0;
    let completedDays = 0;
    for (const { total, completed } of dayMap.values()) {
      if (total > 0) {
        rateSum += (completed / total) * 100;
        if (completed === total) completedDays++;
      }
    }

    const monthlyPct = daysInMonth === 0 ? 0 : Math.round((rateSum / daysInMonth) * 10) / 10;
    return { monthlyPct, daysInMonth, activeDays: dayMap.size, completedDays };
  }
}
