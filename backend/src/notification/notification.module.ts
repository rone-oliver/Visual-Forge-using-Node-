import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { INotificationGatewayToken } from './interfaces/notification-gateway.interface';
import { INotificationRepositoryToken } from './interfaces/notification-repository.interface';
import { INotificationServiceToken } from './interfaces/notification-service.interface';
import { Notification, NotificationSchema } from './models/notification.schema';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  providers: [
    {
      provide: INotificationGatewayToken,
      useClass: NotificationGateway,
    },
    {
      provide: INotificationServiceToken,
      useClass: NotificationService,
    },
    {
      provide: INotificationRepositoryToken,
      useClass: NotificationRepository,
    },
  ],
  controllers: [NotificationController],
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  exports: [
    INotificationGatewayToken,
    INotificationServiceToken,
    INotificationRepositoryToken,
  ],
})
export class NotificationModule {}
