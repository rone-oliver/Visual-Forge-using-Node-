import { Message } from 'src/chat/models/chat-message.schema';

export const IAiServiceToken = Symbol('IAiServiceToken');

export interface IAiService {
  generateSmartReplies(
    messages: Message[],
    currentUserId: string,
  ): Promise<string[]>;
}
