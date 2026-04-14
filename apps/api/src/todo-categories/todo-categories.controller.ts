import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TodoCategoriesService } from './todo-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('todo-categories')
@UseGuards(JwtAuthGuard)
export class TodoCategoriesController {
  constructor(private service: TodoCategoriesService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.service.findAll(userId);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() body: { name: string; color: string }) {
    return this.service.create(userId, body);
  }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() body: any) {
    return this.service.update(userId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
