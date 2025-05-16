import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessagesDocument, MessageStatus } from './models/chat-message.schema';
import { User, UserDocument } from 'src/users/models/user.schema';

@WebSocketGateway({ 
    cors: { origin:'http://localhost:' + process.env.FRONTEND_PORT, credentials: true },
    namespace: '/chat'
}) // Enable CORS for development
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(ChatGateway.name);
    private userSocketMap: Map<string, string> = new Map();

    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessagesDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>, // Assuming you have a User model
    ) { }

    async handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);
        // You might want to authenticate the user here based on a token or query parameter
        // For simplicity, we'll assume the client sends their userId on connection
        try {
            const userId = client.handshake.query.userId as string;
            if (!userId) {
                this.logger.warn(`Client ${client.id} connected without userId`);
                client.disconnect();
                return;
            }
    
            this.userSocketMap.set(userId, client.id);
            client['userId'] = userId;
    
            await this.userModel.findByIdAndUpdate(
                new Types.ObjectId(userId),
                { isOnline: true }
            );
    
            client.emit('connected', { message: 'Successfully connected to chat!' });
            this.logger.log(`Client ${client.id} associated with user: ${userId}`);
        } catch (error) {
            this.logger.error('Error in handleConnection:', error);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        try {
            const userId = client['userId'];
            if (userId) {
                // Remove from mapping
                this.userSocketMap.delete(userId);
                
                // Update user's online status
                await this.userModel.findByIdAndUpdate(
                    new Types.ObjectId(userId),
                    { isOnline: false }
                );
            }
            
            this.logger.log(`Client disconnected: ${client.id}`);
        } catch (error) {
            this.logger.error('Error in handleDisconnect:', error);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(client: Socket, payload: { recipientId: string; content: string }) {
        this.logger.log(`Message received from ${client['userId']}: ${payload.content} to ${payload.recipientId}`);

        try {
            const senderId = client['userId'];
            if (!senderId) {
                this.logger.warn(`Sender ID not found for socket ${client.id}`);
                client.emit('messageError', { error: 'User not authenticated' });
                return;
            }

            // Create and save the message
            const newMessage = await this.messageModel.create({
                sender: new Types.ObjectId(senderId),
                recipient: new Types.ObjectId(payload.recipientId),
                content: payload.content,
            });

            // Convert to plain object for sending
            const messageToSend = newMessage.toObject();
            
            // Emit to sender
            client.emit('newMessage', messageToSend);
            
            // Emit to recipient if online
            const recipientSocketId = this.userSocketMap.get(payload.recipientId);
            if (recipientSocketId) {
                this.server.to(recipientSocketId).emit('newMessage', messageToSend);
                
                // Update status to delivered since recipient is online
                await this.messageModel.findByIdAndUpdate(
                    newMessage._id,
                    { status: MessageStatus.DELIVERED }
                );
                
                // Notify sender of delivery
                client.emit('messageStatusUpdate', { 
                    messageId: newMessage._id.toString(),
                    status: MessageStatus.DELIVERED 
                });
            }
        } catch (error) {
            this.logger.error('Error saving and sending message:', error);
            client.emit('messageError', { error: 'Failed to send message' });
        }
    }

    @SubscribeMessage('updateMessageStatus')
    async handleUpdateMessageStatus(client: Socket, payload: { messageId: string; status: MessageStatus }) {
        try {
            const { messageId, status } = payload;
            
            // Update message status in database
            await this.messageModel.findByIdAndUpdate(
                new Types.ObjectId(messageId),
                { status }
            );
            
            // Find the message to get sender ID
            const message = await this.messageModel.findById(messageId);
            if (!message) {
                return;
            }
            
            // Notify the sender about status update
            const senderSocketId = this.userSocketMap.get(message.sender.toString());
            if (senderSocketId) {
                this.server.to(senderSocketId).emit('messageStatusUpdate', { messageId, status });
            }
        } catch (error) {
            this.logger.error('Error updating message status:', error);
        }
    }

    private getClientSocketId(userId: string): string | undefined {
        // In a real application, you would maintain a mapping of userId to socketId
        // This could be in memory (for simple cases) or in a more persistent store like Redis
        // For this basic example, we'll iterate through connected clients (not efficient for large scale)
        for (const clientId of Object.keys(this.server.sockets.sockets)) {
            if (this.server.sockets.sockets[clientId]['userId'] === userId) {
                return clientId;
            }
        }
        return undefined;
    }
}