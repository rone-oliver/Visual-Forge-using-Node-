import { Body, Controller, Get, Param, Post, Req, UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Types } from 'mongoose';
import { IChatService, IChatServiceToken } from './interfaces/chat-service.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('user/chats')
@UseGuards(AuthGuard,RolesGuard)
export class ChatController {
  constructor(
      @Inject(IChatServiceToken) private readonly chatService: IChatService,
  ){};

  @Get('list')
  @Roles(Role.USER,Role.EDITOR)
  async getChatList(@GetUser('userId') userId: string) {
    return this.chatService.getChatList(new Types.ObjectId(userId));
  }

  @Post('')
  @Roles(Role.USER,Role.EDITOR)
  async createNewChat(@GetUser('userId') userId: string, @Body() body: { recipientId: string }){
    return this.chatService.createNewChat(new Types.ObjectId(userId), new Types.ObjectId(body.recipientId));
  }

  @Get('messages/:recipientId')
  @Roles(Role.USER,Role.EDITOR)
  async getMessagesBetweenUsers(
    @GetUser('userId') userId: string,
    @Param('recipientId') recipientId: string,
  ) {
    return this.chatService.getMessagesBetweenUsers(new Types.ObjectId(userId), new Types.ObjectId(recipientId));
  }

  @Get(':userId')
  @Roles(Role.USER,Role.EDITOR)
  async getUserInfo(@Param('userId') userId: string){
    return this.chatService.getUserInfoForChatList(new Types.ObjectId(userId));
  }
}
