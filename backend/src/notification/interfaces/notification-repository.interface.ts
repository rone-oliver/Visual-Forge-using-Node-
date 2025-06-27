import { CreateNotificationDto } from "../dtos/create-notification.dto";
import { Notification } from "../models/notification.schema";

export const INotificationRepositoryToken = Symbol('INotificationRepository');

export interface INotificationRepository {
    create(createNotificationDto: CreateNotificationDto): Promise<Notification>;
    findByUserId(userId: string): Promise<Notification[]>;
    findUnreadByUserId(userId: string): Promise<Notification[]>;
    findById(id: string): Promise<Notification | null>;
    update(id: string, data: Partial<Notification>): Promise<Notification | null>;
    updateMany(filter:{userId:string, unread: boolean}, data: Partial<Notification>): Promise<any>;
    delete(id: string): Promise<any>;
    countUnread(userId: string): Promise<number>;
}