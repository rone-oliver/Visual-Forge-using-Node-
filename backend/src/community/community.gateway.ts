import { Inject, Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

import {
  ICommunityService,
  ICommunityServiceToken,
} from './interfaces/community.service.interface';
import { Community } from './models/community.schema';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.PRODUCTION_CORS_ORIGIN || process.env.DEVELOPMENT_CORS_ORIGIN,
    credentials: true,
  },
  namespace: '/community',
})
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.EDITOR)
export class CommunityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly _logger = new Logger(CommunityGateway.name);

  constructor(
    @Inject(ICommunityServiceToken)
    private readonly _communityService: ICommunityService,
  ) {}

  handleConnection(client: Socket) {
    this._logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this._logger.warn(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinCommunity')
  async handleJoinCommunity(
    @MessageBody() communityId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client['user']?.userId;
    if (!userId) {
      client.emit(
        'error',
        'Authentication token not provided or user not found.',
      );
      return;
    }

    const isMember = await this._communityService.isUserMember(
      communityId,
      userId,
    );
    if (isMember) {
      client.join(communityId);
      this._logger.log(`${client.id} joined room ${communityId}`);
      client.emit(
        'joinedCommunity',
        `Successfully joined community ${communityId}`,
      );
    } else {
      this._logger.warn(
        `User ${userId} attempted to join community ${communityId} without membership.`,
      );
      client.emit('joinError', {
        communityId,
        message: 'You are not a member of this community.',
      });
    }
  }

  @SubscribeMessage('leaveCommunity')
  async handleLeaveCommunity(
    @MessageBody() communityId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client['user']?.userId;
    if (!userId) {
      client.emit(
        'error',
        'Authentication token not provided or user not found.',
      );
      return;
    }

    const isLeaved = await this._communityService.leaveCommunity(
      communityId,
      userId,
    );
    if (isLeaved) {
      client.leave(communityId);
      this._logger.log(`${client.id} left room ${communityId}`);
      client.emit(
        'leftCommunity',
        `Successfully left community ${communityId}`,
      );
    } else {
      this._logger.warn(
        `User ${userId} attempted to leave community ${communityId} without membership.`,
      );
      client.emit('leaveError', {
        communityId,
        message: 'You are not a member of this community.',
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { communityId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client['user']?.userId;
    if (!senderId) {
      client.emit(
        'error',
        'Authentication token not provided or user not found.',
      );
      return;
    }

    const newMessage = await this._communityService.sendMessage(
      data.communityId,
      senderId,
      data.content,
    );

    const populatedMessage = await this._communityService.getMessageById(
      newMessage._id.toString(),
    );

    if (populatedMessage) {
      this.server.to(data.communityId).emit('newMessage', populatedMessage);
    }
  }

  @OnEvent('community.created')
  handleCommunityCreated(payload: Community) {
    this.server.emit('newCommunity', payload);
  }

  @OnEvent('community.member.joined')
  handleMemberJoined(payload: { communityId: string; userId: string }) {
    this.server.to(payload.communityId).emit('memberJoined', payload);
  }
}
