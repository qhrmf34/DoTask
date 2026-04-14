import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PomodoroService } from './pomodoro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('crews/:crewId/pomodoro')
@UseGuards(JwtAuthGuard)
export class PomodoroController {
  constructor(private service: PomodoroService) {}

  @Get()
  getActive(@Param('crewId') crewId: string) {
    return this.service.getActive(crewId);
  }

  @Post('start')
  start(
    @CurrentUser('sub') userId: string,
    @Param('crewId') crewId: string,
    @Body() body: { workMinutes?: number; breakMinutes?: number },
  ) {
    return this.service.start(crewId, userId, body.workMinutes ?? 25, body.breakMinutes ?? 5);
  }

  @Patch('pause')
  pause(
    @CurrentUser('sub') userId: string,
    @Param('crewId') crewId: string,
  ) {
    return this.service.pause(crewId, userId);
  }

  @Patch('resume')
  resume(
    @CurrentUser('sub') userId: string,
    @Param('crewId') crewId: string,
  ) {
    return this.service.resume(crewId, userId);
  }

  @Delete('end')
  end(
    @CurrentUser('sub') userId: string,
    @Param('crewId') crewId: string,
  ) {
    return this.service.end(crewId, userId);
  }

  @Post('join')
  join(
    @CurrentUser('sub') userId: string,
    @Param('crewId') crewId: string,
  ) {
    return this.service.join(crewId, userId);
  }
}
