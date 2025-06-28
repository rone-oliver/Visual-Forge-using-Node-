import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './models/chat-message.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { ChatController } from './chat.controller';
import { AiModule } from 'src/ai/ai.module';
import { JwtModule } from '@nestjs/jwt';
import { IChatServiceToken } from './interfaces/chat-service.interface';
import { IChatRepositoryToken } from './interfaces/chat-repository.interface';
import { ChatRepository } from './repositories/chat.repository';
import { IChatGatewayToken } from './interfaces/chat-gateway.interface';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: userSchema}
    ]),
    UsersModule, AiModule, JwtModule.register({}), AuthModule
  ],
  providers: [
    {
      provide: IChatServiceToken,
      useClass: ChatService
    },
    {
      provide: IChatRepositoryToken,
      useClass: ChatRepository
    },
    {
      provide: IChatGatewayToken,
      useClass: ChatGateway
    }
  ],
  controllers: [ChatController],
  exports: [IChatServiceToken]
})
export class ChatModule {}
