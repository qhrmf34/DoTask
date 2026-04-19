import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private service: ChannelsService) {}

  @Get('crews/:crewId/channels')
  getByCrewId(@CurrentUser('sub') userId: string, @Param('crewId') crewId: string) {
    return this.service.getByCrewId(userId, crewId);
  }

  @Post('crews/:crewId/channels')
  create(
    @CurrentUser('sub') userId: string,
    @Param('crewId') crewId: string,
    @Body() body: { name: string; type?: string; order?: number },
  ) {
    return this.service.create(userId, crewId, body);
  }

  @Patch('channels/:id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.update(userId, id, body);
  }

  @Delete('channels/:id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
