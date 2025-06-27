import { Notification } from '../models/notification.schema';

export const INotificationGatewayToken = Symbol('INotificationGateway');

export interface INotificationGateway {
  sendNotificationToUser(userId: string, notification: Notification): void;

  sendStatusUpdate(userId: string, update: { notificationId: string; status: 'read' | 'unread' }): void;

  sendBulkStatusUpdate(userId: string, status: 'read' | 'unread' | 'deleted'): void;
}
