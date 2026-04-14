import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TodoCategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.todoCategory.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { todos: true } } },
    });
  }

  create(userId: string, data: { name: string; color: string }) {
    return this.prisma.todoCategory.create({ data: { ...data, userId } });
  }

  async update(userId: string, id: string, data: Partial<{ name: string; color: string; order: number }>) {
    const cat = await this.prisma.todoCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException();
    if (cat.userId !== userId) throw new ForbiddenException();
    return this.prisma.todoCategory.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const cat = await this.prisma.todoCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException();
    if (cat.userId !== userId) throw new ForbiddenException();
    return this.prisma.todoCategory.delete({ where: { id } });
  }
}
