import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from './models/notification.schema';
import { NotificationGateway } from './notification.gateway';

export interface CreateNotificationParams {
    userId: string | Types.ObjectId;
    message: string;
    type: NotificationType;
    unread?: boolean;
    data?: any;
    quotationId?: string | Types.ObjectId;
    worksId?: string | Types.ObjectId;
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<Notification>,
        private notificationGateway: NotificationGateway,
    ) { }

    async createNotification(params: CreateNotificationParams): Promise<Notification | null> {
        try {
            const userId = typeof params.userId === 'string' ? new Types.ObjectId(params.userId) : params.userId;
            const quotationId = params.quotationId ? 
                (typeof params.quotationId === 'string' ? new Types.ObjectId(params.quotationId) : params.quotationId) : 
                undefined;
            const worksId = params.worksId ? 
                (typeof params.worksId === 'string' ? new Types.ObjectId(params.worksId) : params.worksId) : 
                undefined;

            const notification = await this.notificationModel.create({
                userId,
                message: params.message,
                type: params.type,
                unread: params.unread !== undefined ? params.unread : true,
                data: params.data || {},
                ...(quotationId && { quotationId }),
                ...(worksId && { worksId }),
            });

            try {
                // Separate try-catch for WebSocket operations to prevent DB transaction failure
                this.notificationGateway.sendNotificationToUser(
                    userId.toString(),
                    notification
                );
            } catch (socketError) {
                this.logger.error(`Failed to send notification via WebSocket: ${socketError.message}`, socketError.stack);
                // Continue execution - we still want to return the notification even if real-time delivery failed
            }
            
            return notification;
        } catch (error) {
            this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
            return null;
        }
    }

    async getNotificationsByUserId(userId: string): Promise<Notification[]> {
        try {
            return await this.notificationModel.find({ userId:new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
        } catch (error) {
            this.logger.error(`Failed to get notifications for user ${userId}: ${error.message}`, error.stack);
            return [];
        }
    }

    async getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
        try {
            return await this.notificationModel.find({ userId:new Types.ObjectId(userId), unread: true }).sort({ createdAt: -1 }).exec();
        } catch (error) {
            this.logger.error(`Failed to get unread notifications for user ${userId}: ${error.message}`, error.stack);
            return [];
        }
    }

    async markAsRead(notificationId: string): Promise<Notification | null> {
        try {
            const notification = await this.notificationModel.findByIdAndUpdate(
                notificationId,
                { unread: false },
                { new: true }
            ).exec();

            if (!notification) {
                throw new NotFoundException(`Notification with ID ${notificationId} not found`);
            }

            try {
                // Separate try-catch for WebSocket operations
                this.notificationGateway.sendStatusUpdate(
                    notification.userId.toString(),
                    { notificationId, status: 'read' }
                );
            } catch (socketError) {
                this.logger.error(`Failed to send status update via WebSocket: ${socketError.message}`, socketError.stack);
                // Continue execution - we still want to return the notification even if real-time update failed
            }

            return notification;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error; // Re-throw NotFoundException for proper HTTP response
            }
            this.logger.error(`Failed to mark notification ${notificationId} as read: ${error.message}`, error.stack);
            return null;
        }
    }

    async markAllAsRead(userId: string): Promise<boolean> {
        try {
            // Get the notifications and update them in a single operation
            const result = await this.notificationModel.updateMany(
                { userId: new Types.ObjectId(userId), unread: true },
                { unread: false }
            ).exec();
            
            const updatedCount = result.modifiedCount || 0;
            
            try {
                // Send real-time updates
                const userIdStr = userId.toString();
                
                if (updatedCount > 0) {
                    // Since we don't have the individual notification IDs, just send a bulk update
                    this.notificationGateway.sendBulkStatusUpdate(userIdStr, 'read');
                    this.logger.log(`Marked ${updatedCount} notifications as read for user ${userId}`);
                }
            } catch (socketError) {
                this.logger.error(`Failed to send bulk status update via WebSocket: ${socketError.message}`, socketError.stack);
            }
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to mark all notifications as read for user ${userId}: ${error.message}`, error.stack);
            return false;
        }
    }

    async deleteNotification(notificationId: string): Promise<boolean> {
        try {
            const notification = await this.notificationModel.findById(notificationId).exec();
            if (!notification) {
                throw new NotFoundException(`Notification with ID ${notificationId} not found`);
            }
            
            // Store userId before deletion
            const userId = notification.userId.toString();
            
            // Delete the notification
            await this.notificationModel.findByIdAndDelete(notificationId).exec();
            
            try {
                // Send real-time update about the deletion
                // Send individual status update
                this.notificationGateway.sendStatusUpdate(
                    userId,
                    { notificationId, status: 'read' } // Using 'read' status as a way to remove from unread count
                );
                
                // Also send a bulk update to refresh the notification list
                this.notificationGateway.sendBulkStatusUpdate(userId, 'deleted');
            } catch (socketError) {
                this.logger.error(`Failed to send deletion update via WebSocket: ${socketError.message}`, socketError.stack);
                // Continue execution - we still want to return success even if real-time update failed
            }
            
            return true;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error; // Re-throw NotFoundException for proper HTTP response
            }
            this.logger.error(`Failed to delete notification ${notificationId}: ${error.message}`, error.stack);
            return false;
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        try {
            return await this.notificationModel.countDocuments({ userId, unread: true }).exec();
        } catch (error) {
            this.logger.error(`Failed to get unread count for user ${userId}: ${error.message}`, error.stack);
            return 0;
        }
    }
}
