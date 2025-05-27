import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './models/notification.schema';

@WebSocketGateway({
    cors: { origin: 'http://localhost:' + process.env.FRONTEND_PORT, credentials: true },
    namespace: '/notifications'
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private userSocketMap: Map<string, string[]> = new Map();
    private logger: Logger = new Logger(NotificationGateway.name);

    constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) { }

    async handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Notification Client connected: ${client.id}`);
        const userId = client.handshake.query.userId as string;
        if (userId) {
            client['userId'] = userId;

            // Store socket ID in the map
            const socketIds = this.userSocketMap.get(userId) || [];
            socketIds.push(client.id);
            this.userSocketMap.set(userId, socketIds);

            // Send initial unread notifications to the connected client
            await this.sendUnreadNotifications(client, userId);
        } else {
            this.logger.warn(`Notification Client ${client.id} connected without userId`);
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Notification Client disconnected: ${client.id}`);
        const userId = client['userId'];
        if (userId) {
            // Remove socket ID from the map
            const sockets = this.userSocketMap.get(userId) || [];
            const index = sockets.indexOf(client.id);
            if (index !== -1) {
                sockets.splice(index, 1);
                if (sockets.length === 0) {
                    this.userSocketMap.delete(userId);
                } else {
                    this.userSocketMap.set(userId, sockets);
                }
            }
        }
    }

    private getClientSocketId(userId: string): string | undefined {
        const sockets = this.userSocketMap.get(userId);
        return sockets && sockets.length > 0 ? sockets[0] : undefined;
    }

    private getAllClientSocketIds(userId: string): string[] {
        return this.userSocketMap.get(userId) || [];
    }

    async sendUnreadNotifications(client: Socket, userId: string): Promise<void> {
        try {
            const unreadNotifications = await this.notificationModel.find({ userId:new Types.ObjectId(userId), unread: true })
                .sort({ createdAt: -1 })
                .exec();
            client.emit('initialNotifications', unreadNotifications);
        } catch (error) {
            this.logger.error('Error fetching unread notifications:', error);
        }
    }

    async sendNotificationToUser(userId: string, notification: Notification): Promise<void> {
        const socketIds = this.getAllClientSocketIds(userId);
        if (socketIds.length > 0) {
            socketIds.forEach(socketId => {
                this.server.to(socketId).emit('newNotification', notification);
            });
        } else {
            this.logger.warn(`No socket found for user ${userId}`);
        }
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(client: Socket, notificationId: string): Promise<void> {
        try {
            const notification = await this.notificationModel.findByIdAndUpdate(
                notificationId,
                { unread: false },
                { new: true }
            ).exec();

            if (notification) {
                // Emit status update to all user's connected devices
                this.sendStatusUpdate(notification.userId.toString(), {
                    notificationId,
                    status: 'read'
                });
            }
        } catch (error) {
            this.logger.error(`Error marking notification as read: ${error.message}`);
        }
    }

    sendStatusUpdate(userId: string, update: { notificationId: string; status: 'read' | 'unread' }): void {
        const socketId = this.getClientSocketId(userId);
        if (socketId) {
            this.server.to(socketId).emit('notificationStatusUpdate', update);
        }
    }

    sendBulkStatusUpdate(userId: string, status: 'read' | 'unread' | 'deleted'): void {
        const socketIds = this.getAllClientSocketIds(userId);
        if (socketIds.length > 0) {
            socketIds.forEach(socketId => {
                this.server.to(socketId).emit('bulkNotificationUpdate', { status });
            });
        } else {
            this.logger.warn(`No socket found for user ${userId} for bulk update`);
        }
    }
}