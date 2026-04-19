import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TodosModule } from './todos/todos.module';
import { TodoCategoriesModule } from './todo-categories/todo-categories.module';
import { CalendarModule } from './calendar/calendar.module';
import { PomodoroSettingsModule } from './pomodoro-settings/pomodoro-settings.module';
import { CrewsModule } from './crews/crews.module';
import { ChannelsModule } from './channels/channels.module';
import { ChatModule } from './chat/chat.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
import { PomodoroModule } from './pomodoro/pomodoro.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    RedisModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    TodosModule,
    TodoCategoriesModule,
    CalendarModule,
    PomodoroSettingsModule,
    CrewsModule,
    ChannelsModule,
    ChatModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    PomodoroModule,
    NotificationsModule,
    AdminModule,
    UploadModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
