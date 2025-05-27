import { Injectable, Logger } from '@nestjs/common';
import { Message, MessagesDocument } from './models/chat-message.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessagesDocument>,
    private readonly userService: UsersService,
  ) { }

  async getChatList(currentUserId: Types.ObjectId) {
    const chatList = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { recipient: currentUserId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          // unreadCount: { 
          //   $sum: { 
          //     $cond: [
          //       { $and: [
          //         { $ne: ['$sender', currentUserId] },
          //         { $eq: ['$status', 'sent'] }
          //       ]},
          //       1, 
          //       0 
          //     ]
          //   }
          // }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: '$userData'
      },
      {
        $project: {
          _id: '$_id',
          username: '$userData.username',
          avatarUrl: '$userData.profileImage',
          isOnline: '$userData.isOnline',
          lastMessage: 1,
          lastMessageTime: 1,
          // unreadCount: 1
        }
      }
    ]);

    return chatList;
  }

  async getMessagesBetweenUsers(currentUserId: Types.ObjectId, recipientId: Types.ObjectId) {
    return await this.messageModel.find({
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .exec();
  }

  async updateMessageStatus(messageId: string, status: 'delivered' | 'read') {
    await this.messageModel.findByIdAndUpdate(messageId, { status });
  }

  async getUserInfoForChatList(userId: Types.ObjectId) {
    try {
      const user = await this.userService.getUserInfoForChatList(userId);
      if (!user) {
        return {
          username: 'Unknown User',
          profileImage: null,
          isOnline: false
        };
      }
      return user;
    } catch (error) {
      this.logger.error(`Error in getUserInfoForChatList: ${error.message}`);
      return {
        username: 'Unknown User',
        profileImage: null,
        isOnline: false
      };
    }
  }

  async createNewChat(senderId: Types.ObjectId, recipientId: Types.ObjectId){
    try {
      console.log(senderId, recipientId);
      const chat = await this.messageModel.create({
        sender: senderId,
        recipient: recipientId,
        content: 'Hi',
      });
      return chat;
    } catch (error) {
      this.logger.error(`Error in createNewChat: ${error.message}`);
      throw error;
    }
  }
}
