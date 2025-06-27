import { forwardRef, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './models/notification.schema';
import { NotificationGateway } from './notification.gateway';
import { INotificationServiceToken } from './interfaces/notification-service.interface';
import { INotificationRepositoryToken } from './interfaces/notification-repository.interface';
import { NotificationRepository } from './repositories/notification.repository';
import { INotificationGatewayToken } from './interfaces/notification-gateway.interface';

@Module({
  providers: [
    {
      provide: INotificationGatewayToken,
      useClass: NotificationGateway
    },
    {
      provide: INotificationServiceToken,
      useClass: NotificationService
    },
    {
      provide: INotificationRepositoryToken,
      useClass: NotificationRepository
    }
  ],
  controllers: [NotificationController],
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema}
    ])
  ],
  exports: [INotificationGatewayToken, INotificationServiceToken, INotificationRepositoryToken]
})
export class NotificationModule {}
