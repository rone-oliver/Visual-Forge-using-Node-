import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from 'src/ai/ai.module';
import { AuthModule } from 'src/auth/auth.module';
import { User, userSchema } from 'src/users/models/user.schema';
import { UsersModule } from 'src/users/users.module';

import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { IChatGatewayToken } from './interfaces/chat-gateway.interface';
import { IChatRepositoryToken } from './interfaces/chat-repository.interface';
import { IChatServiceToken } from './interfaces/chat-service.interface';
import { Message, MessageSchema } from './models/chat-message.schema';
import { ChatRepository } from './repositories/chat.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: userSchema },
    ]),
    UsersModule,
    AiModule,
    JwtModule.register({}),
    AuthModule,
  ],
  providers: [
    {
      provide: IChatServiceToken,
      useClass: ChatService,
    },
    {
      provide: IChatRepositoryToken,
      useClass: ChatRepository,
    },
    {
      provide: IChatGatewayToken,
      useClass: ChatGateway,
    },
  ],
  controllers: [ChatController],
  exports: [IChatServiceToken],
})
export class ChatModule {}
