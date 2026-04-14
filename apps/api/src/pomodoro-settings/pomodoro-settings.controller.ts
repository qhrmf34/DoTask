import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { PomodoroSettingsService } from './pomodoro-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('pomodoro-settings')
@UseGuards(JwtAuthGuard)
export class PomodoroSettingsController {
  constructor(private service: PomodoroSettingsService) {}

  @Get()
  get(@CurrentUser('sub') userId: string) {
    return this.service.get(userId);
  }

  @Patch()
  update(@CurrentUser('sub') userId: string, @Body() body: any) {
    return this.service.update(userId, body);
  }

  @Delete('reset')
  reset(@CurrentUser('sub') userId: string) {
    return this.service.reset(userId);
  }
}
