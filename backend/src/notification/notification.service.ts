import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { Types } from 'mongoose';
import { Notification, NotificationType } from './models/notification.schema';
import { OnEvent } from '@nestjs/event-emitter';
import { EventTypes } from 'src/common/constants/events.constants';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { INotificationRepository, INotificationRepositoryToken } from './interfaces/notification-repository.interface';
import { INotificationService } from './interfaces/notification-service.interface';
import { INotificationGateway, INotificationGatewayToken } from './interfaces/notification-gateway.interface';

@Injectable()
export class NotificationService implements INotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @Inject(INotificationRepositoryToken) private readonly notificationRepository: INotificationRepository,
        @Inject(forwardRef(() => INotificationGatewayToken)) 
        private readonly notificationGateway: INotificationGateway,
    ) { }

    async createNotification(params: CreateNotificationDto): Promise<Notification | null> {
        try {
            const notification = await this.notificationRepository.create(params);

            try {
                // Separate try-catch for WebSocket operations to prevent DB transaction failure
                this.notificationGateway.sendNotificationToUser(
                    notification.userId.toString(),
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
            return await this.notificationRepository.findByUserId(userId);
        } catch (error) {
            this.logger.error(`Failed to get notifications for user ${userId}: ${error.message}`, error.stack);
            return [];
        }
    }

    @OnEvent(EventTypes.BID_ACCEPTED)
    async handleBidAcceptedEvent(payload: {
        bidId: Types.ObjectId,
        quotationId: Types.ObjectId,
        editorId: Types.ObjectId,
        userId: Types.ObjectId,
        title: string, 
        bidAmount: number
    }) {
        this.logger.log(`Handling bid accepted event for bid ${payload.bidId}`);
        
        try {
            // Notify the user who accepted the bid
            await this.createNotification({
                userId: payload.userId.toString(),
                message: 'You have successfully accepted a bid',
                type: NotificationType.WORK,
                quotationId: payload.quotationId.toString(),
                data: {
                    bidId: payload.bidId.toString(),
                    editorId: payload.editorId.toString()
                }
            });
            
            // Notify the editor whose bid was accepted
            await this.createNotification({
                userId: payload.editorId.toString(),
                message: `Your bid for the work '${payload.title}' has been accepted.`,
                type: NotificationType.WORK,
                quotationId: payload.quotationId.toString(),
                data: {
                    bidId: payload.bidId.toString(),
                    userId: payload.userId.toString()
                }
            });

        } catch (error) {
            this.logger.error(`Failed to handle bid accepted event: ${error.message}`, error.stack);
        }
    }

    @OnEvent(EventTypes.QUOTATION_CREATED)
    async handleQuotationCreatedEvent(payload: {
        quotationId: Types.ObjectId,
        userId: Types.ObjectId,
        title: string,
        amount: number
    }) {
        this.logger.log(`Handling quotation created event for quotation ${payload.quotationId}`);
        
        try {
            // Notify the user who created the quotation
            await this.createNotification({
                userId: payload.userId.toString(),
                message: 'You have successfully created a quotation',
                type: NotificationType.WORK,
                quotationId: payload.quotationId.toString(),
            });
        } catch (error) {
            this.logger.error(`Failed to handle quotation created event: ${error.message}`, error.stack);
        }
    }

    @OnEvent(EventTypes.QUOTATION_COMPLETED)
    async handleQuotationCompletedEvent(payload: {
        quotationId: Types.ObjectId,
        userId: Types.ObjectId,
        title: string,
        amount: number,
        type: NotificationType,
        message: string,
        data: any,
        worksId: Types.ObjectId
    }) {
        this.logger.log(`Handling quotation completed event for quotation ${payload.quotationId}`);
        
        try {
            // Notify the user who created the quotation
            await this.createNotification({
                userId: payload.userId.toString(),
                message: payload.message || 'You have successfully completed a quotation',
                type: payload.type || NotificationType.WORK,
                quotationId: payload.quotationId.toString(),
                worksId: payload.worksId.toString(),
                data: payload.data,
            });
        } catch (error) {
            this.logger.error(`Failed to handle quotation completed event: ${error.message}`, error.stack);
        }
    }

    async getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
        try {
            return await this.notificationRepository.findUnreadByUserId(userId);
        } catch (error) {
            this.logger.error(`Failed to get unread notifications for user ${userId}: ${error.message}`, error.stack);
            return [];
        }
    }

    async markAsRead(notificationId: string): Promise<Notification> {
        const notification = await this.notificationRepository.update(notificationId, { unread: false });
        if (!notification) {
            throw new NotFoundException(`Notification with ID "${notificationId}" not found`);
        }

        // Notify the gateway to push the status update to the client
        this.notificationGateway.sendStatusUpdate(notification.userId.toString(), {
            notificationId,
            status: 'read'
        });

        return notification;
    }

    async markAllAsRead(userId: string): Promise<any> {
        const result = await this.notificationRepository.updateMany({ userId, unread: true }, { unread: false });
        
        const updatedCount = result.modifiedCount || 0;
        
        try {
            if (updatedCount > 0) {
                this.notificationGateway.sendBulkStatusUpdate(userId, 'read');
                this.logger.log(`Marked ${updatedCount} notifications as read for user ${userId}`);
            }
        } catch (socketError) {
            this.logger.error(`Failed to send bulk status update via WebSocket: ${socketError.message}`, socketError.stack);
        }
        
        return true;
    }

    async deleteNotification(notificationId: string): Promise<boolean> {
        try {
            const notification = await this.notificationRepository.findById(notificationId);
            if (!notification) {
                throw new NotFoundException(`Notification with ID ${notificationId} not found`);
            }
            
            const userId = notification.userId.toString();
            
            await this.notificationRepository.delete(notificationId);
            
            try {
                this.notificationGateway.sendBulkStatusUpdate(userId, 'deleted');
            } catch (socketError) {
                this.logger.error(`Failed to send deletion update via WebSocket: ${socketError.message}`, socketError.stack);
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
            return await this.notificationRepository.countUnread(userId);
        } catch (error) {
            this.logger.error(`Failed to get unread count for user ${userId}: ${error.message}`, error.stack);
            return 0;
        }
    }
}
