import {
  Controller, Get, Patch, Delete, Post, Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  /** 채널 메시지 목록 (커서 페이지네이션) */
  @Get('channels/:channelId/messages')
  getMessages(
    @CurrentUser('sub') userId: string,
    @Param('channelId') channelId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(userId, channelId, cursor);
  }

  /** 메시지 수정 */
  @Patch('messages/:id')
  updateMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.chatService.updateMessage(userId, id, content);
  }

  /** 메시지 삭제 */
  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  deleteMessage(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.chatService.deleteMessage(userId, id, role);
  }

  /** 메시지 신고 */
  @Post('messages/:id/report')
  reportMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { reason: string; detail?: string },
  ) {
    return this.chatService.reportMessage(userId, id, body.reason, body.detail);
  }
}
