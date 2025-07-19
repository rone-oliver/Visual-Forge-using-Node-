import { Controller, Delete, Get, Inject, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Notification } from './models/notification.schema';
import { INotificationService, INotificationServiceToken } from './interfaces/notification-service.interface';

@Controller('user/notifications')
@UseGuards(RolesGuard)
@Roles('User', 'Editor')
export class NotificationController {
    constructor(
        @Inject(INotificationServiceToken) private readonly _notificationService: INotificationService,
    ) { };

    @Get()
    async getNotifications(@GetUser('userId') userId: string): Promise<Notification[]> {
        return this._notificationService.getNotificationsByUserId(userId);
    }

    @Get('unread')
    async getUnreadNotifications(@GetUser('userId') userId: string): Promise<Notification[]> {
        return this._notificationService.getUnreadNotificationsByUserId(userId);
    }

    @Get('count')
    async getUnreadCount(@GetUser('userId') userId: string): Promise<{ count: number }> {
        const count = await this._notificationService.getUnreadCount(userId);
        return { count };
    }

    @Post(':id/read')
    async markAsRead(@Param('id') id: string): Promise<Notification> {
        const notification = await this._notificationService.markAsRead(id);
        if (!notification) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }
        return notification;
    }

    @Post('read-all')
    async markAllAsRead(@GetUser('userId') userId: string): Promise<{ success: boolean }> {
        await this._notificationService.markAllAsRead(userId);
        return { success: true };
    }

    @Delete(':id')
    async deleteNotification(@Param('id') id: string): Promise<{ success: boolean }> {
        await this._notificationService.deleteNotification(id);
        return { success: true };
    }
}
