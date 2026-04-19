import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CrewsService } from './crews.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CrewsController {
  constructor(
    private crewsService: CrewsService,
    private uploadService: UploadService,
  ) {}

  @Get('crews')
  search(@Query('q') q?: string, @Query('cat') cat?: string, @Query('sort') sort?: string) {
    return this.crewsService.search(q, cat, sort);
  }

  @Get('crews/my')
  getMyCrews(@CurrentUser('sub') userId: string) {
    return this.crewsService.findMyCrews(userId);
  }

  @Get('crews/:id/today-stats')
  getTodayStats(@Param('id') crewId: string) {
    return this.crewsService.getTodayStats(crewId);
  }

  @Post('crews')
  @UseInterceptors(FileInterceptor('banner'))
  async create(
    @CurrentUser('sub') userId: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const uploadedBannerUrl = file ? await this.uploadService.uploadFile(file, 'banners') : undefined;
    const bannerUrl = uploadedBannerUrl ?? body.bannerImage;
    return this.crewsService.create(userId, body, bannerUrl);
  }

  @Get('crews/:id')
  findOne(@Param('id') id: string) {
    return this.crewsService.findOne(id);
  }

  @Patch('crews/:id')
  @UseInterceptors(FileInterceptor('banner'))
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const uploadedBannerUrl = file ? await this.uploadService.uploadFile(file, 'banners') : undefined;
    const bannerUrl = uploadedBannerUrl ?? body.bannerImage;
    return this.crewsService.update(userId, id, { ...body, bannerImage: bannerUrl });
  }

  @Delete('crews/:id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.crewsService.remove(userId, id);
  }

  @Post('crews/:id/join')
  join(
    @CurrentUser('sub') userId: string,
    @Param('id') crewId: string,
    @Body('password') password?: string,
  ) {
    return this.crewsService.join(userId, crewId, password);
  }

  @Delete('crews/:id/leave')
  leave(@CurrentUser('sub') userId: string, @Param('id') crewId: string) {
    return this.crewsService.leave(userId, crewId);
  }

  @Get('crews/invite/:code')
  findByInviteCode(@Param('code') code: string) {
    return this.crewsService.findByInviteCode(code);
  }

  @Post('crews/invite/:code/join')
  joinByInvite(@CurrentUser('sub') userId: string, @Param('code') code: string) {
    return this.crewsService.joinByInvite(userId, code);
  }

  @Get('crews/:id/members')
  getMembers(@Param('id') crewId: string) {
    return this.crewsService.getMembers(crewId);
  }

  @Get('crews/:crewId/members/:userId/todos')
  getMemberTodos(
    @CurrentUser('sub') requesterId: string,
    @Param('crewId') crewId: string,
    @Param('userId') userId: string,
    @Query('date') date: string,
  ) {
    return this.crewsService.getMemberTodos(requesterId, crewId, userId, date);
  }

  @Patch('crews/:id/members/:userId')
  updateMemberRole(
    @CurrentUser('sub') requesterId: string,
    @Param('id') crewId: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: string,
  ) {
    return this.crewsService.updateMemberRole(requesterId, crewId, targetUserId, role);
  }

  @Delete('crews/:id/members/:userId')
  kickMember(
    @CurrentUser('sub') requesterId: string,
    @Param('id') crewId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.crewsService.kickMember(requesterId, crewId, targetUserId);
  }

  @Patch('crews/:id/invite-code')
  regenerateInviteCode(@CurrentUser('sub') userId: string, @Param('id') crewId: string) {
    return this.crewsService.regenerateInviteCode(userId, crewId);
  }

  @Patch('crews/:id/transfer/:targetUserId')
  transferOwnership(
    @CurrentUser('sub') userId: string,
    @Param('id') crewId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.crewsService.transferOwnership(userId, crewId, targetUserId);
  }
}
