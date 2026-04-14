import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      client.data.user = payload;
      this.userSocketMap.set(payload.sub, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.userSocketMap.delete(client.data.user.sub);
    }
  }

  @SubscribeMessage('chat:join')
  handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string } | string) {
    const channelId = typeof data === 'string' ? data : data?.channelId;
    if (channelId) client.join(`channel:${channelId}`);
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string } | string) {
    const channelId = typeof data === 'string' ? data : data?.channelId;
    if (channelId) client.leave(`channel:${channelId}`);
  }

  @SubscribeMessage('chat:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      channelId: string;
      content: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      fileMimeType?: string;
      metadata?: any;
    },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const message = await this.chatService.createMessage({ ...data, userId });
    this.server.to(`channel:${data.channelId}`).emit('chat:message', message);
  }

  @SubscribeMessage('chat:edit')
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    const message = await this.chatService.updateMessage(userId, data.messageId, data.content);
    this.server.to(`channel:${message.channelId}`).emit('chat:edited', message);
  }

  @SubscribeMessage('chat:delete')
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.user?.sub;
    const role = client.data.user?.role;
    if (!userId) return;
    const message = await this.chatService.deleteMessage(userId, data.messageId, role);
    this.server.to(`channel:${message.channelId}`).emit('chat:deleted', { id: message.id, channelId: message.channelId });
  }

  /** 크루 온라인 현황 브로드캐스트 */
  broadcastOnline(crewId: string, userIds: string[]) {
    this.server.to(`crew:${crewId}`).emit('chat:online', { crewId, userIds });
  }

  /** 서버에서 직접 메시지 전송 (할일 완료 공유 등) */
  emitToChannel(channelId: string, event: string, data: any) {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }

  /** 특정 유저에게 알림 전송 */
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
