import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { Message, MessageStatus } from '../models/chat-message.schema';

export const IChatGatewayToken = Symbol('IChatGatewayToken');

export interface IChatGateway extends OnGatewayConnection, OnGatewayDisconnect {
  handleMessage(
    client: Socket,
    payload: { recipientId: string; content: string },
  ): Promise<void>;
  handleUpdateMessageStatus(
    client: Socket,
    payload: { messageId: string; status: MessageStatus },
  ): Promise<void>;
  handleTyping(client: Socket, payload: { recipientId: string }): void;
  handleStopTyping(client: Socket, payload: { recipientId: string }): void;
  handleGetSmartReplies(
    client: Socket,
    payload: { messages: Message[] },
  ): Promise<void>;
}
