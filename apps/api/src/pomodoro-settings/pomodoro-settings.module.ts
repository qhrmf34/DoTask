import { Module } from '@nestjs/common';
import { PomodoroSettingsController } from './pomodoro-settings.controller';
import { PomodoroSettingsService } from './pomodoro-settings.service';

@Module({ controllers: [PomodoroSettingsController], providers: [PomodoroSettingsService] })
export class PomodoroSettingsModule {}
