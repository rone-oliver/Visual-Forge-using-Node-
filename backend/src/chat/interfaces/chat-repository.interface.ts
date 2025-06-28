import { Types } from 'mongoose';
import { Message, MessageStatus } from '../models/chat-message.schema';

export const IChatRepositoryToken = Symbol('IChatRepository');

export interface IChatRepository {
  create(senderId: Types.ObjectId, recipientId: Types.ObjectId, content: string): Promise<Message>;

  findMessagesBetweenUsers(userId1: Types.ObjectId, userId2: Types.ObjectId): Promise<Message[]>;

  getChatList(userId: Types.ObjectId): Promise<any[]>; // The return type is complex, 'any' is a placeholder for now

  updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message | null>;
}