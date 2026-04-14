import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private service: ReactionsService) {}

  @Post('todos/:id/reactions')
  reactTodo(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('type') type: 'LIKE' | 'DISLIKE',
  ) {
    return this.service.toggle(userId, 'TODO', id, type);
  }

  @Post('posts/:id/reactions')
  reactPost(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('type') type: 'LIKE' | 'DISLIKE',
  ) {
    return this.service.toggle(userId, 'POST', id, type);
  }

  @Post('comments/:id/reactions')
  reactComment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('type') type: 'LIKE' | 'DISLIKE',
  ) {
    return this.service.toggle(userId, 'COMMENT', id, type);
  }
}
