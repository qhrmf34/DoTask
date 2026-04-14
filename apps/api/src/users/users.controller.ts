import {
  Controller, Get, Patch, Post, Delete, Body, UseGuards,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private uploadService: UploadService,
  ) {}

  @Get('me')
  getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Get('me/stats')
  getStats(@CurrentUser('sub') userId: string) {
    return this.usersService.getStats(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('sub') userId: string,
    @Body() body: { nickname?: string; bio?: string },
  ) {
    return this.usersService.updateMe(userId, body);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.uploadService.uploadFile(file, 'avatars');
    return this.usersService.updateAvatar(userId, url);
  }

  @Delete('me/avatar')
  deleteAvatar(@CurrentUser('sub') userId: string) {
    return this.usersService.deleteAvatar(userId);
  }

  @Delete('me')
  deleteMe(@CurrentUser('sub') userId: string) {
    return this.usersService.deleteMe(userId);
  }
}
