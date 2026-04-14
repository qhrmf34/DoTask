import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  getList(
    @CurrentUser('sub') userId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.service.getList(userId, cursor, take ? parseInt(take) : 20);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.service.markRead(userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.service.markAllRead(userId);
  }
}
