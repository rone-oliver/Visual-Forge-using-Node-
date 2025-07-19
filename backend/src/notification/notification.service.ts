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
    private readonly _logger = new Logger(NotificationService.name);

    constructor(
        @Inject(INotificationRepositoryToken) private readonly _notificationRepository: INotificationRepository,
        @Inject(forwardRef(() => INotificationGatewayToken)) private readonly _notificationGateway: INotificationGateway,
    ) { }

    async createNotification(params: CreateNotificationDto): Promise<Notification | null> {
        try {
            const notification = await this._notificationRepository.create(params);

            try {
                // Separate try-catch for WebSocket operations to prevent DB transaction failure
                this._notificationGateway.sendNotificationToUser(
                    notification.userId.toString(),
                    notification
                );
            } catch (socketError) {
                this._logger.error(`Failed to send notification via WebSocket: ${socketError.message}`, socketError.stack);
                // Continue execution - we still want to return the notification even if real-time delivery failed
            }
            
            return notification;
        } catch (error) {
            this._logger.error(`Failed to create notification: ${error.message}`, error.stack);
            return null;
        }
    }

    async getNotificationsByUserId(userId: string): Promise<Notification[]> {
        try {
            return await this._notificationRepository.findByUserId(userId);
        } catch (error) {
            this._logger.error(`Failed to get notifications for user ${userId}: ${error.message}`, error.stack);
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
        this._logger.log(`Handling bid accepted event for bid ${payload.bidId}`);
        
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
            this._logger.error(`Failed to handle bid accepted event: ${error.message}`, error.stack);
        }
    }

    @OnEvent(EventTypes.QUOTATION_CREATED)
    async handleQuotationCreatedEvent(payload: {
        quotationId: Types.ObjectId,
        userId: Types.ObjectId,
        title: string,
        amount: number
    }) {
        this._logger.log(`Handling quotation created event for quotation ${payload.quotationId}`);
        
        try {
            // Notify the user who created the quotation
            await this.createNotification({
                userId: payload.userId.toString(),
                message: 'You have successfully created a quotation',
                type: NotificationType.WORK,
                quotationId: payload.quotationId.toString(),
            });
        } catch (error) {
            this._logger.error(`Failed to handle quotation created event: ${error.message}`, error.stack);
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
        this._logger.log(`Handling quotation completed event for quotation ${payload.quotationId}`);
        
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
            this._logger.error(`Failed to handle quotation completed event: ${error.message}`, error.stack);
        }
    }

    @OnEvent(EventTypes.PAYMENT_REFUNDED)
    async handlePaymentRefunded(payload: { recipient: Types.ObjectId, message: string, type: NotificationType }) {
        this._logger.log(`Handling payment refunded event for user ${payload.recipient}`);
        await this.createNotification({
            userId: payload.recipient.toString(),
            message: payload.message,
            type: payload.type,
        });
    }

    @OnEvent(EventTypes.EDITOR_WARNING)
    async handleEditorWarning(payload: { recipient: Types.ObjectId, message: string, type: NotificationType }) {
        this._logger.log(`Handling editor warning event for editor ${payload.recipient}`);
        await this.createNotification({
            userId: payload.recipient.toString(),
            message: payload.message,
            type: payload.type,
        });
    }

    @OnEvent(EventTypes.EDITOR_SUSPENDED)
    async handleEditorSuspended(payload: { recipient: Types.ObjectId, message: string, type: NotificationType }) {
        this._logger.log(`Handling editor suspended event for editor ${payload.recipient}`);
        await this.createNotification({
            userId: payload.recipient.toString(),
            message: payload.message,
            type: payload.type,
        });
    }

    async getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
        try {
            return await this._notificationRepository.findUnreadByUserId(userId);
        } catch (error) {
            this._logger.error(`Failed to get unread notifications for user ${userId}: ${error.message}`, error.stack);
            return [];
        }
    }

    async markAsRead(notificationId: string): Promise<Notification> {
        const notification = await this._notificationRepository.update(notificationId, { unread: false });
        if (!notification) {
            throw new NotFoundException(`Notification with ID "${notificationId}" not found`);
        }

        // Notify the gateway to push the status update to the client
        this._notificationGateway.sendStatusUpdate(notification.userId.toString(), {
            notificationId,
            status: 'read'
        });

        return notification;
    }

    async markAllAsRead(userId: string): Promise<any> {
        const result = await this._notificationRepository.updateMany({ userId, unread: true }, { unread: false });
        
        const updatedCount = result.modifiedCount || 0;
        
        try {
            if (updatedCount > 0) {
                this._notificationGateway.sendBulkStatusUpdate(userId, 'read');
                this._logger.log(`Marked ${updatedCount} notifications as read for user ${userId}`);
            }
        } catch (socketError) {
            this._logger.error(`Failed to send bulk status update via WebSocket: ${socketError.message}`, socketError.stack);
        }
        
        return true;
    }

    async deleteNotification(notificationId: string): Promise<boolean> {
        try {
            const notification = await this._notificationRepository.findById(notificationId);
            if (!notification) {
                throw new NotFoundException(`Notification with ID ${notificationId} not found`);
            }
            
            const userId = notification.userId.toString();
            
            await this._notificationRepository.delete(notificationId);
            
            try {
                this._notificationGateway.sendBulkStatusUpdate(userId, 'deleted');
            } catch (socketError) {
                this._logger.error(`Failed to send deletion update via WebSocket: ${socketError.message}`, socketError.stack);
            }
            
            return true;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error; // Re-throw NotFoundException for proper HTTP response
            }
            this._logger.error(`Failed to delete notification ${notificationId}: ${error.message}`, error.stack);
            return false;
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        try {
            return await this._notificationRepository.countUnread(userId);
        } catch (error) {
            this._logger.error(`Failed to get unread count for user ${userId}: ${error.message}`, error.stack);
            return 0;
        }
    }
}
