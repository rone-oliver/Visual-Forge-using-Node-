import { Inject, Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/users.service.interface';

import {
  IChatRepository,
  IChatRepositoryToken,
} from './interfaces/chat-repository.interface';
import { IChatService } from './interfaces/chat-service.interface';
import { Message, MessageStatus } from './models/chat-message.schema';

@Injectable()
export class ChatService implements IChatService {
  private readonly _logger = new Logger(ChatService.name);

  constructor(
    @Inject(IChatRepositoryToken)
    private readonly _chatRepository: IChatRepository,
    @Inject(IUsersServiceToken) private readonly _userService: IUsersService,
  ) {}

  async getChatList(currentUserId: Types.ObjectId) {
    return this._chatRepository.getChatList(currentUserId);
  }

  async getMessagesBetweenUsers(
    currentUserId: Types.ObjectId,
    recipientId: Types.ObjectId,
  ) {
    return this._chatRepository.findMessagesBetweenUsers(
      currentUserId,
      recipientId,
    );
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
  ): Promise<Message | null> {
    return this._chatRepository.updateMessageStatus(messageId, status);
  }

  async getUserInfoForChatList(userId: Types.ObjectId) {
    try {
      const user = await this._userService.getUserInfoForChatList(userId);
      if (!user) {
        return {
          username: 'Unknown User',
          profileImage: null,
          isOnline: false,
        };
      }
      return user;
    } catch (error) {
      this._logger.error(`Error in getUserInfoForChatList: ${error.message}`);
      return {
        username: 'Unknown User',
        profileImage: null,
        isOnline: false,
      };
    }
  }

  async createNewChat(senderId: Types.ObjectId, recipientId: Types.ObjectId) {
    try {
      return this._chatRepository.create(senderId, recipientId, 'Hi');
    } catch (error) {
      this._logger.error(`Error in createNewChat: ${error.message}`);
      throw error;
    }
  }

  async createMessage(
    senderId: Types.ObjectId,
    recipientId: Types.ObjectId,
    content: string,
  ): Promise<Message> {
    try {
      return this._chatRepository.create(senderId, recipientId, content);
    } catch (error) {
      this._logger.error(`Error in createMessage: ${error.message}`);
      throw error;
    }
  }
}
