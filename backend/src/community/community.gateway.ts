import { Inject, Logger, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import { Server, Socket } from "socket.io";
import { Roles } from "src/auth/decorators/roles.decorator";
import { WsAuthGuard } from "src/auth/guards/ws-auth.guard";
import { WsRolesGuard } from "src/auth/guards/ws-roles.guard";
import { Community } from "./models/community.schema";
import { Role } from "src/common/enums/role.enum";
import { ICommunityService, ICommunityServiceToken } from "./interfaces/community.service.interface";

@WebSocketGateway({
    cors: { origin: 'http://localhost:' + process.env.FRONTEND_PORT, credentials: true },
    namespace: '/community'
})
@UseGuards(WsAuthGuard, WsRolesGuard)
@Roles(Role.EDITOR)
export class CommunityGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(CommunityGateway.name);

    constructor(
        @Inject(ICommunityServiceToken) private readonly communityService: ICommunityService
    ) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.warn(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinCommunity')
    async handleJoinCommunity(@MessageBody() communityId: string, @ConnectedSocket() client: Socket) {
        const userId = client['user']?.userId;
        if (!userId) {
            client.emit('error', 'Authentication token not provided or user not found.');
            return;
        }

        const isMember = await this.communityService.isUserMember(communityId, userId);
        if (isMember) {
            client.join(communityId);
            this.logger.log(`${client.id} joined room ${communityId}`);
            client.emit('joinedCommunity', `Successfully joined community ${communityId}`);
        } else {
            this.logger.warn(`User ${userId} attempted to join community ${communityId} without membership.`);
            client.emit('joinError', { communityId, message: 'You are not a member of this community.' });
        }
    }

    @SubscribeMessage('leaveCommunity')
    async handleLeaveCommunity(@MessageBody() communityId: string, @ConnectedSocket() client: Socket) {
        const userId = client['user']?.userId;
        if (!userId) {
            client.emit('error', 'Authentication token not provided or user not found.');
            return;
        }

        const isLeaved = await this.communityService.leaveCommunity(communityId, userId);
        if (isLeaved) {
            client.leave(communityId);
            this.logger.log(`${client.id} left room ${communityId}`);
            client.emit('leftCommunity', `Successfully left community ${communityId}`);
        } else {
            this.logger.warn(`User ${userId} attempted to leave community ${communityId} without membership.`);
            client.emit('leaveError', { communityId, message: 'You are not a member of this community.' });
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() data: { communityId: string; content: string },
        @ConnectedSocket() client: Socket
    ) {
        const senderId = client['user']?.userId;
        if (!senderId) {
            client.emit('error', 'Authentication token not provided or user not found.');
            return;
        }

        const newMessage = await this.communityService.sendMessage(data.communityId, senderId, data.content);

        const populatedMessage = await this.communityService.getMessageById(newMessage._id.toString());

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