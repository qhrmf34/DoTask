import {
  Controller, Get, Patch, Post, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private service: AdminService) {}

  // ── 통계 ─────────────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  // ── 유저 관리 ─────────────────────────────────────────────────
  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getUsers(page ? +page : 1, limit ? +limit : 20, search);
  }

  @Patch('users/:id/toggle-active')
  toggleUserActive(
    @CurrentUser('sub') adminId: string,
    @Param('id') targetId: string,
  ) {
    return this.service.toggleUserActive(adminId, targetId);
  }

  @Delete('users/:id')
  deleteUser(
    @CurrentUser('sub') adminId: string,
    @Param('id') targetId: string,
  ) {
    return this.service.deleteUser(adminId, targetId);
  }

  // ── 크루 관리 ─────────────────────────────────────────────────
  @Get('crews')
  getCrews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getCrews(page ? +page : 1, limit ? +limit : 20, search);
  }

  @Delete('crews/:id')
  deleteCrew(@Param('id') crewId: string) {
    return this.service.deleteCrew(crewId);
  }

  @Get('crews/:id/posts')
  getCrewPosts(
    @Param('id') crewId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getCrewPosts(crewId, page ? +page : 1, limit ? +limit : 10);
  }

  @Get('crews/:id/messages')
  getCrewMessages(
    @Param('id') crewId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getCrewMessages(crewId, page ? +page : 1, limit ? +limit : 10);
  }

  // ── 게시글 관리 ───────────────────────────────────────────────
  @Get('posts')
  getPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getPosts(page ? +page : 1, limit ? +limit : 20);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') postId: string) {
    return this.service.deletePost(postId);
  }

  // ── 채팅 메시지 관리 ──────────────────────────────────────────
  @Get('messages')
  getMessages(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMessages(page ? +page : 1, limit ? +limit : 20);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') messageId: string) {
    return this.service.deleteMessage(messageId);
  }

  // ── 신고 관리 ─────────────────────────────────────────────────
  @Get('reports')
  getReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getReports(page ? +page : 1, limit ? +limit : 20, status);
  }

  @Patch('reports/:id')
  updateReport(
    @Param('id') reportId: string,
    @Body('status') status: 'REVIEWED' | 'DISMISSED',
  ) {
    return this.service.updateReportStatus(reportId, status);
  }

  @Post('reports/:id/notify')
  notifyReporter(@Param('id') reportId: string) {
    return this.service.notifyReporter(reportId);
  }
}
