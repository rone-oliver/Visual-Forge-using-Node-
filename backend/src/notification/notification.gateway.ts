import { Logger, Inject } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { INotificationGateway } from './interfaces/notification-gateway.interface';
import {
  INotificationService,
  INotificationServiceToken,
} from './interfaces/notification-service.interface';
import { Notification } from './models/notification.schema';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5200',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, INotificationGateway
{
  @WebSocketServer()
  server: Server;
  private _userSocketMap: Map<string, string[]> = new Map();
  private readonly _logger: Logger = new Logger(NotificationGateway.name);

  constructor(
    @Inject(INotificationServiceToken)
    private readonly notificationService: INotificationService,
  ) {}

  async handleConnection(client: Socket, ...args: any[]) {
    this._logger.log(`Notification Client connected: ${client.id}`);
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client['userId'] = userId;

      const socketIds = this._userSocketMap.get(userId) || [];
      socketIds.push(client.id);
      this._userSocketMap.set(userId, socketIds);

      await this.sendUnreadNotifications(client, userId);
    } else {
      this._logger.warn(
        `Notification Client ${client.id} connected without userId`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this._logger.log(`Notification Client disconnected: ${client.id}`);
    const userId = client['userId'];
    if (userId) {
      const sockets = this._userSocketMap.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this._userSocketMap.delete(userId);
        } else {
          this._userSocketMap.set(userId, sockets);
        }
      }
    }
  }

  private async sendUnreadNotifications(
    client: Socket,
    userId: string,
  ): Promise<void> {
    try {
      const unreadNotifications =
        await this.notificationService.getUnreadNotificationsByUserId(userId);
      client.emit('initialNotifications', unreadNotifications);
    } catch (error) {
      this._logger.error('Error fetching unread notifications:', error);
    }
  }

  sendNotificationToUser(userId: string, notification: Notification): void {
    const socketIds = this.getAllClientSocketIds(userId);
    if (socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('newNotification', notification);
      });
    } else {
      this._logger.warn(`No socket found for user ${userId}`);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    client: Socket,
    notificationId: string,
  ): Promise<void> {
    try {
      await this.notificationService.markAsRead(notificationId);
    } catch (error) {
      this._logger.error(
        `Error marking notification as read: ${error.message}`,
      );
    }
  }

  private getAllClientSocketIds(userId: string): string[] {
    return this._userSocketMap.get(userId) || [];
  }

  sendStatusUpdate(
    userId: string,
    update: { notificationId: string; status: 'read' | 'unread' },
  ): void {
    const socketIds = this.getAllClientSocketIds(userId);
    if (socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('notificationStatusUpdate', update);
      });
    }
  }

  sendBulkStatusUpdate(
    userId: string,
    status: 'read' | 'unread' | 'deleted',
  ): void {
    const socketIds = this.getAllClientSocketIds(userId);
    if (socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('bulkNotificationUpdate', { status });
      });
    } else {
      this._logger.warn(`No socket found for user ${userId} for bulk update`);
    }
  }
}
