import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { ChatService } from './chat.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Types } from 'mongoose';

@Controller('user/chats')
@UseGuards(AuthGuard,RolesGuard)
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
    ){};

    @Get('list')
    @Roles('User','Editor')
  async getChatList(@Req() req: Request) {
    const user = req['user'] as { userId: Types.ObjectId, role: string };
    return this.chatService.getChatList(new Types.ObjectId(user.userId));
  }

  @Post('')
  @Roles('User','Editor')
  async createNewChat(@Req() req: Request, @Body() body: { recipientId: string }){
    const user = req['user'] as { userId: Types.ObjectId, role: string };
    return this.chatService.createNewChat(new Types.ObjectId(user.userId), new Types.ObjectId(body.recipientId));
  }

  @Get('messages/:recipientId')
  @Roles('User','Editor')
  async getMessagesBetweenUsers(
    @Req() req: Request,
    @Param('recipientId') recipientId: string,
  ) {
    const user = req['user'] as { userId: Types.ObjectId, role: string };
    return this.chatService.getMessagesBetweenUsers(new Types.ObjectId(user.userId), new Types.ObjectId(recipientId));
  }

  @Get(':userId')
  @Roles('User','Editor')
  async getUserInfo(@Param('userId') userId: string){
    return this.chatService.getUserInfoForChatList(new Types.ObjectId(userId));
  }
}
