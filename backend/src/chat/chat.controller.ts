import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/common/enums/role.enum';

import {
  IChatService,
  IChatServiceToken,
} from './interfaces/chat-service.interface';

@Controller('user/chats')
@UseGuards(AuthGuard, RolesGuard)
export class ChatController {
  constructor(
    @Inject(IChatServiceToken) private readonly _chatService: IChatService,
  ) {}

  @Get('list')
  @Roles(Role.USER, Role.EDITOR)
  async getChatList(@GetUser('userId') userId: string) {
    return this._chatService.getChatList(new Types.ObjectId(userId));
  }

  @Post('')
  @Roles(Role.USER, Role.EDITOR)
  async createNewChat(
    @GetUser('userId') userId: string,
    @Body() body: { recipientId: string },
  ) {
    return this._chatService.createNewChat(
      new Types.ObjectId(userId),
      new Types.ObjectId(body.recipientId),
    );
  }

  @Get('messages/:recipientId')
  @Roles(Role.USER, Role.EDITOR)
  async getMessagesBetweenUsers(
    @GetUser('userId') userId: string,
    @Param('recipientId') recipientId: string,
  ) {
    return this._chatService.getMessagesBetweenUsers(
      new Types.ObjectId(userId),
      new Types.ObjectId(recipientId),
    );
  }

  @Get(':userId')
  @Roles(Role.USER, Role.EDITOR)
  async getUserInfo(@Param('userId') userId: string) {
    return this._chatService.getUserInfoForChatList(new Types.ObjectId(userId));
  }
}
