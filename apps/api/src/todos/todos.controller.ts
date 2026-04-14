import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Get()
  findByDate(@CurrentUser('sub') userId: string, @Query('date') date: string) {
    return this.todosService.findByDate(userId, date || new Date().toISOString().split('T')[0]);
  }

  @Get('monthly-stats')
  getMonthlyStats(
    @CurrentUser('sub') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const now = new Date();
    return this.todosService.getMonthlyStats(
      userId,
      parseInt(year) || now.getFullYear(),
      parseInt(month) || now.getMonth() + 1,
    );
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateTodoDto) {
    return this.todosService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todosService.update(userId, id, dto);
  }

  @Patch(':id/complete')
  toggleComplete(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.todosService.toggleComplete(userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.todosService.remove(userId, id);
  }
}
