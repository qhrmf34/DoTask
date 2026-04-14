import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private postsService: PostsService,
    private uploadService: UploadService,
  ) {}

  @Get('crews/:crewId/posts')
  getByCrewId(@Param('crewId') crewId: string, @Query('cursor') cursor?: string) {
    return this.postsService.getByCrewId(crewId, cursor);
  }

  @Post('crews/:crewId/posts')
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @CurrentUser('sub') userId: string,
    @Param('crewId') crewId: string,
    @Body('content') content: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const imageUrls = files
      ? await Promise.all(files.map((f) => this.uploadService.uploadFile(f, 'posts')))
      : [];
    return this.postsService.create(userId, crewId, content, imageUrls);
  }

  @Patch('posts/:id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.postsService.update(userId, id, content);
  }

  @Delete('posts/:id')
  remove(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.postsService.remove(userId, id, role);
  }

  @Patch('posts/:id/pin')
  togglePin(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.postsService.togglePin(userId, id);
  }

  @Post('posts/:id/report')
  report(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { reason: string; detail?: string },
  ) {
    return this.postsService.report(userId, id, body.reason, body.detail);
  }
}
