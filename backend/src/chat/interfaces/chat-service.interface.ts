import { Types } from 'mongoose';
import { Message, MessageStatus } from '../models/chat-message.schema';

export const IChatServiceToken = Symbol('IChatService');

export interface IChatService {
  getChatList(currentUserId: Types.ObjectId): Promise<any[]>;

  getMessagesBetweenUsers(currentUserId: Types.ObjectId, recipientId: Types.ObjectId): Promise<Message[]>;

  updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message | null>;

  getUserInfoForChatList(userId: Types.ObjectId): Promise<any>;

  createNewChat(senderId: Types.ObjectId, recipientId: Types.ObjectId): Promise<Message>;

  createMessage(senderId: Types.ObjectId, recipientId: Types.ObjectId, content: string): Promise<Message>;
}