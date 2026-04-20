import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

const USE_LOCAL = !process.env.AWS_ACCESS_KEY_ID;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class UploadService {
  private s3: S3Client | null = null;
  private bucket = process.env.AWS_S3_BUCKET || 'dotask-uploads';

  constructor() {
    if (!USE_LOCAL) {
      this.s3 = new S3Client({
        region: process.env.AWS_REGION || 'ap-northeast-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
    } else {
      // 로컬 업로드 폴더 생성
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'misc'): Promise<string> {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;

    if (USE_LOCAL) {
      return this.saveLocal(file, folder, fileName);
    }
    return this.uploadS3(file, folder, fileName);
  }

  private saveLocal(file: Express.Multer.File, folder: string, fileName: string): string {
    const dir = path.join(UPLOADS_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, fileName), file.buffer);

    const apiUrl = process.env.API_BASE_URL || `http://localhost:${process.env.API_PORT || 4200}`;
    return `${apiUrl}/uploads/${folder}/${fileName}`;
  }

  private async uploadS3(file: Express.Multer.File, folder: string, fileName: string): Promise<string> {
    const key = `${folder}/${fileName}`;
    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: `inline; filename="${encodeURIComponent(file.originalname)}"`,
      }),
    );
    return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${key}`;
  }

  getFileMeta(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
