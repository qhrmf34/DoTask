import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PomodoroSettingsService {
  constructor(private prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.pomodoroSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  update(userId: string, data: any) {
    return this.prisma.pomodoroSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  reset(userId: string) {
    return this.prisma.pomodoroSettings.upsert({
      where: { userId },
      create: { userId },
      update: {
        workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15,
        longBreakInterval: 4, autoStartBreak: false, autoStartWork: false,
        soundEnabled: true, soundVolume: 80,
      },
    });
  }
}
