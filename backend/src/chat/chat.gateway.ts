import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { Message, MessageStatus } from './models/chat-message.schema';
import { AiService } from 'src/ai/ai.service';
import { WsAuthGuard } from 'src/auth/guards/ws-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WsRolesGuard } from 'src/auth/guards/ws-roles.guard';
import { IChatService, IChatServiceToken } from './interfaces/chat-service.interface';
import { Role } from 'src/common/enums/role.enum';
import { IChatGateway } from './interfaces/chat-gateway.interface';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { IAiService, IAiServiceToken } from 'src/ai/interfaces/ai-service.interface';

@WebSocketGateway({ 
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5200', credentials: true },
    namespace: '/chat'
})
// @UseGuards(WsAuthGuard, WsRolesGuard) 
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.USER, Role.EDITOR) 
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, IChatGateway {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(ChatGateway.name);
    private userSocketMap: Map<string, string> = new Map();

    constructor(
        @Inject(IChatServiceToken) private readonly chatService: IChatService,
        @Inject(IAiServiceToken) private readonly aiService: IAiService,
    ) { }

    async handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);
        try {
            // const user = client['user'] as { userId: string, role: string };
            const userId = client.handshake.query.userId as string;
            if (!userId) {
                this.logger.warn(`Client ${client.id} connected without userId`);
                return client.disconnect();
            }
            client['userId'] = userId;
    
            this.userSocketMap.set(userId, client.id);
    
            client.emit('connected', { message: 'Successfully connected to chat!' });
            this.logger.log(`Client ${client.id} associated with user: ${userId}`);
        } catch (error) {
            this.logger.error('Error in handleConnection:', error);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        try {
            const userId = client.handshake.query.userId as string;
            if (userId) {
                this.userSocketMap.delete(userId);
            }
            this.logger.warn(`Client disconnected: ${client.id}`);
        } catch (error) {
            this.logger.error('Error in handleDisconnect:', error);
        }
    }

    @SubscribeMessage('message')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { recipientId: string; content: string }
    ) {
        this.logger.log(`Message received from ${client.handshake.query.userId}: ${payload.content} to ${payload.recipientId}`);

        try {
            const sender = client['userId'] as string;
            if (!sender) {
                this.logger.warn(`Sender ID not found for socket ${client.id}`);
                client.emit('messageError', { error: 'User not authenticated' });
                return;
            }

            const newMessage = await this.chatService.createMessage(
                new Types.ObjectId(sender),
                new Types.ObjectId(payload.recipientId),
                payload.content,
            );
            
            client.emit('newMessage', newMessage);
            
            const recipientSocketId = this.userSocketMap.get(payload.recipientId);
            if (recipientSocketId) {
                this.server.to(recipientSocketId).emit('newMessage', newMessage);
                
                const updatedMessage = await this.chatService.updateMessageStatus(newMessage._id.toString(), MessageStatus.DELIVERED);
                
                if (updatedMessage) {
                    client.emit('messageStatusUpdate', { 
                        messageId: updatedMessage._id.toString(),
                        status: updatedMessage.status 
                    });
                }
            }
        } catch (error) {
            this.logger.error('Error saving and sending message:', error);
            client.emit('messageError', { error: 'Failed to send message' });
        }
    }

    @SubscribeMessage('updateMessageStatus')
    async handleUpdateMessageStatus(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { messageId: string; status: MessageStatus }
    ) {
        try {
            const { messageId, status } = payload;
            
            const updatedMessage = await this.chatService.updateMessageStatus(messageId, status);
            
            if (!updatedMessage) return;
            
            const senderSocketId = this.userSocketMap.get(updatedMessage.sender.toString());
            if (senderSocketId) {
                this.server.to(senderSocketId).emit('messageStatusUpdate', { messageId, status });
            }
        } catch (error) {
            this.logger.error('Error updating message status:', error);
        }
    }

    @SubscribeMessage('typing')
    handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { recipientId: string }): void {
        const recipientSocketId = this.userSocketMap.get(payload.recipientId);
        if (recipientSocketId) {
            const user = client['user'] as { userId: string };
            this.server.to(recipientSocketId).emit('typing', { userId: user.userId });
        }
    }

    @SubscribeMessage('stopTyping')
    handleStopTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { recipientId: string }): void {
        const recipientSocketId = this.userSocketMap.get(payload.recipientId);
        if (recipientSocketId) {
            const user = client['user'] as { userId: string };
            this.server.to(recipientSocketId).emit('stopTyping', { userId: user.userId });
        }
    }

    @SubscribeMessage('getSmartReplies')
    async handleGetSmartReplies(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { messages: Message[] }
    ) {
        this.logger.log(`Smart reply request received from ${client['userId']}`);
        try {
            const suggestions = await this.aiService.generateSmartReplies(payload.messages, client['userId']);
            client.emit('smartRepliesResult', { suggestions });
        } catch (error) {
            this.logger.error('Error getting smart replies:', error.message);
            client.emit('smartRepliesResult', { error: 'Failed to generate smart replies.' });
        }
    }
}