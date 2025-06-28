import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessagesDocument, MessageStatus } from '../models/chat-message.schema';
import { IChatRepository } from '../interfaces/chat-repository.interface';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessagesDocument>,
  ) { }

  async create(senderId: Types.ObjectId, recipientId: Types.ObjectId, content: string): Promise<Message> {
    const chat = await this.messageModel.create({
      sender: senderId,
      recipient: recipientId,
      content: content,
    });
    return chat;
  }

  async findMessagesBetweenUsers(userId1: Types.ObjectId, userId2: Types.ObjectId): Promise<Message[]> {
    return await this.messageModel.find({
      $or: [
        { sender: userId1, recipient: userId2 },
        { sender: userId2, recipient: userId1 }
      ]
    })
    .sort({ createdAt: 1 })
    .exec();
  }

  async getChatList(userId: Types.ObjectId): Promise<any[]> {
    const chatList = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
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
        }
      }
    ]);
    return chatList;
  }

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message | null> {
    return this.messageModel.findByIdAndUpdate(
        messageId,
        { status },
        { new: true }
    );
  }
}