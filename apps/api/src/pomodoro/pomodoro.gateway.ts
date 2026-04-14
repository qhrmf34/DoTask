import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PomodoroService } from './pomodoro.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL, credentials: true } })
export class PomodoroGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private pomodoroService: PomodoroService,
    private jwtService: JwtService,
  ) {}

  afterInit() {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {}

  private crewRoom(crewId: string) {
    return `crew:${crewId}:pomo`;
  }

  @SubscribeMessage('pomo:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() { crewId }: { crewId: string },
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) return;

    client.join(this.crewRoom(crewId));

    const session = await this.pomodoroService.join(crewId, userId).catch(() => null);
    if (session) {
      this.server.to(this.crewRoom(crewId)).emit('pomo:state', session);
    } else {
      // No active session — send null state
      client.emit('pomo:state', null);
    }
  }

  @SubscribeMessage('pomo:start')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    { crewId, workMinutes = 25, breakMinutes = 5 }: { crewId: string; workMinutes?: number; breakMinutes?: number },
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) return;

    try {
      const session = await this.pomodoroService.start(crewId, userId, workMinutes, breakMinutes);
      client.join(this.crewRoom(crewId));
      this.server.to(this.crewRoom(crewId)).emit('pomo:state', session);
    } catch (e: any) {
      client.emit('pomo:error', { message: e.message });
    }
  }

  @SubscribeMessage('pomo:pause')
  async handlePause(
    @ConnectedSocket() client: Socket,
    @MessageBody() { crewId }: { crewId: string },
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) return;

    try {
      const session = await this.pomodoroService.pause(crewId, userId);
      this.server.to(this.crewRoom(crewId)).emit('pomo:state', session);
    } catch (e: any) {
      client.emit('pomo:error', { message: e.message });
    }
  }

  @SubscribeMessage('pomo:resume')
  async handleResume(
    @ConnectedSocket() client: Socket,
    @MessageBody() { crewId }: { crewId: string },
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) return;

    try {
      const session = await this.pomodoroService.resume(crewId, userId);
      this.server.to(this.crewRoom(crewId)).emit('pomo:state', session);
    } catch (e: any) {
      client.emit('pomo:error', { message: e.message });
    }
  }

  @SubscribeMessage('pomo:end')
  async handleEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() { crewId }: { crewId: string },
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) return;

    try {
      await this.pomodoroService.end(crewId, userId);
      this.server.to(this.crewRoom(crewId)).emit('pomo:state', null);
    } catch (e: any) {
      client.emit('pomo:error', { message: e.message });
    }
  }
}
