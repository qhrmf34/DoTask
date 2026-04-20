process.env.TZ = 'Asia/Seoul';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as path from 'path';
import * as fs from 'fs';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 로컬 업로드 폴더 static 서빙
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));
  app.use(cookieParser());

  const isDev = process.env.NODE_ENV !== 'production';
  const allowedOrigins = isDev
    ? ['http://localhost:3000', 'http://localhost:3001']
    : (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.API_PORT || 4200;
  await app.listen(port);
  console.log(`API server running on http://localhost:${port}`);
  console.log(`File storage: ${process.env.AWS_ACCESS_KEY_ID ? 'AWS S3' : 'Local (./uploads)'}`);
}

bootstrap();
