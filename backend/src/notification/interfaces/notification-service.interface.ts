import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { Notification } from '../models/notification.schema';

export const INotificationServiceToken = Symbol('INotificationService');

export interface INotificationService {
  createNotification(params: CreateNotificationDto): Promise<Notification | null>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<any>;
  deleteNotification(notificationId: string): Promise<any>;
  getUnreadCount(userId: string): Promise<number>;
}
