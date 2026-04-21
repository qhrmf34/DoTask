import { Controller, Get, Post, Patch, Delete, Query, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Post('events')
  createEvent(
    @CurrentUser('sub') userId: string,
    @Body() body: { title: string; date: string; color?: string; emoji?: string },
  ) {
    return this.service.createEvent(userId, body);
  }

  @Patch('events/:id')
  updateEvent(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; date?: string; color?: string; emoji?: string },
  ) {
    return this.service.updateEvent(userId, id, body);
  }

  @Delete('events/:id')
  @HttpCode(HttpStatus.OK)
  deleteEvent(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.deleteEvent(userId, id);
  }
}
