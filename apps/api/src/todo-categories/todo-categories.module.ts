import { Module } from '@nestjs/common';
import { TodoCategoriesController } from './todo-categories.controller';
import { TodoCategoriesService } from './todo-categories.service';

@Module({
  controllers: [TodoCategoriesController],
  providers: [TodoCategoriesService],
})
export class TodoCategoriesModule {}
