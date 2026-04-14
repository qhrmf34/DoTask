import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('todos/calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private service: CalendarService) {}

  @Get()
  getMonthData(
    @CurrentUser('sub') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.service.getMonthData(userId, parseInt(year), parseInt(month));
  }

  @Get('stats')
  getMonthStats(@CurrentUser('sub') userId: string, @Query('year') year: string) {
    return this.service.getMonthStats(userId, parseInt(year));
  }
}
