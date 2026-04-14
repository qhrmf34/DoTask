import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';

const SESSION_KEY = (crewId: string) => `pomo:crew:${crewId}`;
const TTL_SECONDS = 60 * 60 * 2; // 2 hours max

export interface RedisPomoSession {
  sessionId: string;
  crewId: string;
  startedById: string;
  workMinutes: number;
  breakMinutes: number;
  status: 'RUNNING' | 'PAUSED' | 'BREAK' | 'DONE';
  endsAt: number; // unix ms
  pausedAt?: number;
  remainingMs?: number;
}

@Injectable()
export class PomodoroService {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async getActive(crewId: string): Promise<RedisPomoSession | null> {
    const raw = await this.redis.get(SESSION_KEY(crewId));
    if (!raw) return null;
    const session: RedisPomoSession = JSON.parse(raw);
    if (session.status === 'DONE') return null;
    if (session.status === 'RUNNING' && Date.now() >= session.endsAt) {
      await this.redis.del(SESSION_KEY(crewId));
      await this.prisma.pomodoroSession.update({
        where: { id: session.sessionId },
        data: { status: 'DONE' },
      }).catch(() => {});
      return null;
    }
    return session;
  }

  async start(
    crewId: string,
    userId: string,
    workMinutes: number,
    breakMinutes: number,
  ): Promise<RedisPomoSession> {
    const existing = await this.getActive(crewId);
    if (existing) throw new BadRequestException('Active session already exists');

    const endsAt = Date.now() + workMinutes * 60 * 1000;
    const dbSession = await this.prisma.pomodoroSession.create({
      data: { crewId, startedById: userId, workMinutes, breakMinutes, endsAt: new Date(endsAt) },
    });
    await this.prisma.pomodoroParticipant.create({
      data: { sessionId: dbSession.id, userId },
    });

    const state: RedisPomoSession = {
      sessionId: dbSession.id,
      crewId,
      startedById: userId,
      workMinutes,
      breakMinutes,
      status: 'RUNNING',
      endsAt,
    };
    await this.redis.set(SESSION_KEY(crewId), JSON.stringify(state), 'EX', TTL_SECONDS);
    return state;
  }

  async pause(crewId: string, userId: string): Promise<RedisPomoSession> {
    const session = await this._requireActive(crewId);
    if (session.status !== 'RUNNING') throw new BadRequestException('Session is not running');
    this._requireStarter(session, userId);

    const now = Date.now();
    const updated: RedisPomoSession = {
      ...session,
      status: 'PAUSED',
      pausedAt: now,
      remainingMs: session.endsAt - now,
    };
    await this.redis.set(SESSION_KEY(crewId), JSON.stringify(updated), 'EX', TTL_SECONDS);
    return updated;
  }

  async resume(crewId: string, userId: string): Promise<RedisPomoSession> {
    const session = await this._requireActive(crewId);
    if (session.status !== 'PAUSED') throw new BadRequestException('Session is not paused');
    this._requireStarter(session, userId);

    const endsAt = Date.now() + (session.remainingMs ?? 0);
    const updated: RedisPomoSession = {
      ...session,
      status: 'RUNNING',
      endsAt,
      pausedAt: undefined,
      remainingMs: undefined,
    };
    await this.redis.set(SESSION_KEY(crewId), JSON.stringify(updated), 'EX', TTL_SECONDS);
    await this.prisma.pomodoroSession.update({
      where: { id: session.sessionId },
      data: { endsAt: new Date(endsAt) },
    });
    return updated;
  }

  async end(crewId: string, userId: string): Promise<void> {
    const session = await this._requireActive(crewId);
    this._requireStarter(session, userId);
    await this.redis.del(SESSION_KEY(crewId));
    await this.prisma.pomodoroSession.update({
      where: { id: session.sessionId },
      data: { status: 'DONE' },
    });
  }

  async join(crewId: string, userId: string): Promise<RedisPomoSession> {
    const session = await this._requireActive(crewId);
    await this.prisma.pomodoroParticipant.upsert({
      where: { sessionId_userId: { sessionId: session.sessionId, userId } },
      create: { sessionId: session.sessionId, userId },
      update: {},
    });
    return session;
  }

  private async _requireActive(crewId: string): Promise<RedisPomoSession> {
    const s = await this.getActive(crewId);
    if (!s) throw new NotFoundException('No active pomodoro session');
    return s;
  }

  private _requireStarter(session: RedisPomoSession, userId: string) {
    if (session.startedById !== userId)
      throw new ForbiddenException('Only the session starter can control it');
  }
}
