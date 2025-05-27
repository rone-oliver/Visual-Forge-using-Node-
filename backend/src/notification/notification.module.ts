import { forwardRef, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './models/notification.schema';
import { NotificationGateway } from './notification.gateway';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [NotificationService, NotificationGateway],
  controllers: [NotificationController],
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema}
    ]),
    forwardRef(() => UsersModule)
  ],
  exports: [NotificationGateway, NotificationService]
})
export class NotificationModule {}
