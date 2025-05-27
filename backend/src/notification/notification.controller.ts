import { Controller, Delete, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { NotificationService } from './notification.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Notification } from './models/notification.schema';

@Controller('user/notifications')
@UseGuards(AuthGuard, RolesGuard)
@Roles('User', 'Editor')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
    ) { };

    @Get()
    async getNotifications(@GetUser('userId') userId: string): Promise<Notification[]> {
        return this.notificationService.getNotificationsByUserId(userId);
    }

    @Get('unread')
    async getUnreadNotifications(@GetUser('userId') userId: string): Promise<Notification[]> {
        return this.notificationService.getUnreadNotificationsByUserId(userId);
    }

    @Get('count')
    async getUnreadCount(@GetUser('userId') userId: string): Promise<{ count: number }> {
        const count = await this.notificationService.getUnreadCount(userId);
        return { count };
    }

    @Post(':id/read')
    async markAsRead(@Param('id') id: string): Promise<Notification> {
        const notification = await this.notificationService.markAsRead(id);
        if (!notification) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }
        return notification;
    }

    @Post('read-all')
    async markAllAsRead(@GetUser('userId') userId: string): Promise<{ success: boolean }> {
        await this.notificationService.markAllAsRead(userId);
        return { success: true };
    }

    @Delete(':id')
    async deleteNotification(@Param('id') id: string): Promise<{ success: boolean }> {
        await this.notificationService.deleteNotification(id);
        return { success: true };
    }
}
