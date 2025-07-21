import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminsModule } from './admins/admins.module';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminsAuthModule } from './auth/admins-auth/admins.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { UsersAuthController } from './auth/users-auth/users-auth.controller';
import { UsersAuthModule } from './auth/users-auth/users.module';
import { ChatModule } from './chat/chat.module';
import { BidsModule } from './common/bids/bids.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { CoreModule } from './common/config/core.module';
import { DatabaseModule } from './common/database/database.module';
import { HashingModule } from './common/hashing/hashing.module';
import { PaymentModule } from './common/payment/payment.module';
import { RelationshipModule } from './common/relationship/relationship.module';
import { TransactionModule } from './common/transaction/transaction.module';
import { CommunityModule } from './community/community.module';
import { EditorsModule } from './editors/editors.module';
import { JobsModule } from './jobs/jobs.module';
import { MailModule } from './mail/mail.module';
import { NotificationModule } from './notification/notification.module';
import { QuotationModule } from './quotation/quotation.module';
import { ReportsModule } from './reports/reports.module';
import { TimelineModule } from './timeline/timeline.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { WorksModule } from './works/works.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongoDB');
        try {
          logger.log('Connecting to MongoDB...');
          return {
            uri:
              configService.get<string>('MONGODB_URI') ||
              'mongodb://127.0.0.1:27017/visualForge',
            connectionFactory: (connection) => {
              connection.on('connected', () => {
                logger.log('✅ Successfully connected to MongoDB');
              });
              connection.on('error', (error) => {
                logger.error(`MongoDB connection error: ${error.message}`);
              });
              connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
              });
              return connection;
            },
          };
        } catch (error) {
          logger.error(`Failed to connect to MongoDB: ${error.message}`);
          throw error;
        }
      },
      inject: [ConfigService],
    }),
    // MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visualForge'),
    AuthModule,
    UsersModule,
    DatabaseModule,
    AdminsModule,
    EditorsModule,
    UsersAuthModule,
    AdminsAuthModule,
    CoreModule,
    PaymentModule,
    ChatModule,
    NotificationModule,
    BidsModule,
    AiModule,
    WalletModule,
    CommunityModule,
    RelationshipModule,
    CloudinaryModule,
    QuotationModule,
    WorksModule,
    JobsModule,
    ReportsModule,
    TransactionModule,
    MailModule,
    HashingModule,
    TimelineModule,
  ],
  controllers: [AppController, UsersAuthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
