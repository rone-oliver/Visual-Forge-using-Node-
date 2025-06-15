import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './models/chat-message.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { ChatController } from './chat.controller';
import { UsersModule } from 'src/users/users.module';
import { AiModule } from 'src/ai/ai.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: userSchema}
    ]),
    UsersModule, AiModule, JwtModule.register({})
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController]
})
export class ChatModule {}
