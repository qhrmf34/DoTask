import { Module } from '@nestjs/common';
import { PomodoroController } from './pomodoro.controller';
import { PomodoroService } from './pomodoro.service';
import { PomodoroGateway } from './pomodoro.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [PomodoroController],
  providers: [PomodoroService, PomodoroGateway],
  exports: [PomodoroService],
})
export class PomodoroModule {}
