import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  // Track connected users: userId -> Set<socketId>
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove from all user mappings
    for (const [userId, sockets] of this.userSockets.entries()) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, payload: { userId: string }) {
    if (!payload?.userId) return;

    if (!this.userSockets.has(payload.userId)) {
      this.userSockets.set(payload.userId, new Set());
    }
    this.userSockets.get(payload.userId)!.add(client.id);

    // Join a room for the user
    client.join(`user:${payload.userId}`);
    this.logger.debug(`User ${payload.userId} registered socket ${client.id}`);
  }

  @SubscribeMessage('joinClassroom')
  handleJoinClassroom(client: Socket, payload: { classroomId: string }) {
    if (!payload?.classroomId) return;
    client.join(`classroom:${payload.classroomId}`);
  }

  // ============================================================
  // Server-side emit methods (called from NotificationService)
  // ============================================================

  /** Broadcast to all connected clients */
  broadcastNotification(notification: {
    id: string;
    title: string;
    content: string;
    type: string;
  }) {
    this.server.emit('notification', notification);
  }

  /** Send to a specific classroom */
  sendToClassroom(
    classroomId: string,
    notification: { id: string; title: string; content: string; type: string },
  ) {
    this.server.to(`classroom:${classroomId}`).emit('notification', notification);
  }

  /** Send to a specific user */
  sendToUser(
    userId: string,
    event: string,
    data: unknown,
  ) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /** Get count of connected users */
  getConnectedCount(): number {
    return this.userSockets.size;
  }
}
