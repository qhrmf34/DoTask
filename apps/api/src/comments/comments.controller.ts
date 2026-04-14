import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private service: CommentsService) {}

  @Get('todos/:todoId/comments')
  getTodoComments(@Param('todoId') todoId: string) {
    return this.service.getTodoComments(todoId);
  }

  @Post('todos/:todoId/comments')
  createForTodo(
    @CurrentUser('sub') userId: string,
    @Param('todoId') todoId: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.service.createForTodo(userId, todoId, body.content, body.parentId);
  }

  @Get('posts/:postId/comments')
  getPostComments(@Param('postId') postId: string) {
    return this.service.getPostComments(postId);
  }

  @Post('posts/:postId/comments')
  createForPost(
    @CurrentUser('sub') userId: string,
    @Param('postId') postId: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.service.createForPost(userId, postId, body.content, body.parentId);
  }

  @Patch('comments/:id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.service.update(userId, id, content);
  }

  @Delete('comments/:id')
  remove(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(userId, id, role);
  }

  @Post('comments/:id/report')
  report(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { reason: string; detail?: string },
  ) {
    return this.service.report(userId, id, body.reason, body.detail);
  }
}
