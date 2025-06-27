import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './common/database/database.module';
import { AdminsModule } from './admins/admins.module';
import { EditorsModule } from './editors/editors.module';
import { UsersAuthModule } from './auth/users-auth/users.module';
import { AdminsAuthModule } from './auth/admins-auth/admins.module';
import { UsersAuthController } from './auth/users-auth/users-auth.controller';
import { JwtService } from '@nestjs/jwt';
import { TokenRefreshService } from './auth/token-refresh/token-refresh.service';
import { TokenRefreshController } from './auth/token-refresh/token-refresh.controller';
import { JwtConfigModule } from './common/config/jwt.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryService } from './common/cloudinary/cloudinary.service';
import { PaymentModule } from './common/payment/payment.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { BidsModule } from './common/bids/bids.module';
import { AiModule } from './ai/ai.module';
import { WalletModule } from './wallet/wallet.module';
import { CommunityModule } from './community/community.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RelationshipModule } from './common/relationship/relationship.module';
import { AuthGuard } from './auth/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true,envFilePath:'.env',}),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongoDB');
        try {
          logger.log('Connecting to MongoDB...');
          return {
            uri: configService.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017/visualForge',
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
    AuthModule,UsersModule, DatabaseModule, AdminsModule, EditorsModule, UsersAuthModule, AdminsAuthModule, JwtConfigModule, PaymentModule, ChatModule, NotificationModule, BidsModule, AiModule, WalletModule, CommunityModule, RelationshipModule
  ],
  controllers: [AppController, UsersAuthController, TokenRefreshController],
  providers: [
    AppService, 
    JwtService, 
    TokenRefreshService, 
    CloudinaryService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
