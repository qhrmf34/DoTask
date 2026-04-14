import {
  Controller, Post, Param, UseGuards, UseInterceptors,
  UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const IMAGE_TYPES = /image\/(jpeg|jpg|png|gif|webp)/;
const MAX_IMAGE = 5 * 1024 * 1024;   // 5MB
const MAX_CREW_BANNER_IMAGE = 15 * 1024 * 1024; // 15MB
const MAX_FILE  = 50 * 1024 * 1024;  // 50MB

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  /** 채팅용 이미지/파일 */
  @Post('chat')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatFile(
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE })] }))
    file: Express.Multer.File,
  ) {
    const isImage = file.mimetype.startsWith('image/');
    const folder = isImage ? 'chat/images' : 'chat/files';
    const url = await this.uploadService.uploadFile(file, folder);
    return { url, fileName: file.originalname, fileSize: file.size, fileMimeType: file.mimetype, type: isImage ? 'IMAGE' : 'FILE' };
  }

  /** 프로필 아바타 */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE }),
          new FileTypeValidator({ fileType: IMAGE_TYPES }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.uploadService.uploadFile(file, 'avatars');
    return { url };
  }

  /** 크루 배너 이미지 */
  @Post('crew-banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCrewBanner(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_CREW_BANNER_IMAGE }),
          new FileTypeValidator({ fileType: IMAGE_TYPES }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.uploadService.uploadFile(file, 'crew-banners');
    return { url };
  }

  /** 게시글 이미지 (최대 5장은 프론트에서 순차 호출) */
  @Post('post-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE }),
          new FileTypeValidator({ fileType: IMAGE_TYPES }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.uploadService.uploadFile(file, 'post-images');
    return { url };
  }
}
