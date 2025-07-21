import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCommunityDto } from '../dto/community.dto';
import { ICommunityRepository } from '../interfaces/community.repository.interface';
import {
  CommunityMessage,
  CommunityMessageDocument,
} from '../models/community-message.schema';
import { Community, CommunityDocument } from '../models/community.schema';

@Injectable()
export class CommunityRepository implements ICommunityRepository {
  constructor(
    @InjectModel(Community.name)
    private readonly _communityModel: Model<CommunityDocument>,
    @InjectModel(CommunityMessage.name)
    private readonly _communityMessageModel: Model<CommunityMessageDocument>,
  ) {}

  async create(
    createCommunityDto: CreateCommunityDto,
    creatorId: string,
  ): Promise<Community> {
    const newCommunity = new this._communityModel({
      ...createCommunityDto,
      creator: new Types.ObjectId(creatorId),
      members: [new Types.ObjectId(creatorId)], // Creator is a member by default
    });
    return newCommunity.save();
  }

  async findAll(): Promise<Community[]> {
    const results = await this._communityModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creatorInfo',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'memberInfo',
        },
      },
      {
        $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          creator: {
            _id: '$creatorInfo._id',
            fullname: '$creatorInfo.fullname',
          },
          members: {
            $map: {
              input: '$memberInfo',
              as: 'member',
              in: { _id: '$$member._id', fullname: '$$member.fullname' },
            },
          },
        },
      },
    ]);

    return results;
  }

  async findById(id: string): Promise<Community> {
    const results = await this._communityModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creatorInfo',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'memberInfo',
        },
      },
      {
        $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          creator: {
            _id: '$creatorInfo._id',
            fullname: '$creatorInfo.fullname',
          },
          members: {
            $map: {
              input: '$memberInfo',
              as: 'member',
              in: { _id: '$$member._id', fullname: '$$member.fullname' },
            },
          },
        },
      },
    ]);

    if (!results || results.length === 0) {
      throw new NotFoundException(`Community with ID "${id}" not found`);
    }

    return results[0];
  }

  async isUserMember(communityId: string, userId: string): Promise<boolean> {
    const count = await this._communityModel.countDocuments({
      _id: new Types.ObjectId(communityId),
      members: new Types.ObjectId(userId),
    });
    return count > 0;
  }

  async addMember(communityId: string, userId: string): Promise<Community> {
    const community = await this._communityModel.findByIdAndUpdate(
      communityId,
      { $addToSet: { members: new Types.ObjectId(userId) } },
      { new: true },
    );
    if (!community) {
      throw new NotFoundException(
        `Community with ID "${communityId}" not found`,
      );
    }
    return community;
  }

  async addMessage(
    communityId: string,
    senderId: string,
    content: string,
  ): Promise<CommunityMessage> {
    return await this._communityMessageModel.create({
      community: new Types.ObjectId(communityId),
      sender: new Types.ObjectId(senderId),
      content,
    });
  }

  async getMessages(
    communityId: string,
    limit: number = 50,
  ): Promise<CommunityMessage[]> {
    const messages = await this._communityMessageModel
      .aggregate([
        {
          $match: {
            community: new Types.ObjectId(communityId),
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $sort: {
            createdAt: 1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender',
          },
        },
        {
          $unwind: '$sender',
        },
        {
          $project: {
            _id: 1,
            community: 1,
            content: 1,
            createdAt: 1,
            updatedAt: 1,
            'sender._id': '$sender._id',
            'sender.fullname': '$sender.fullname',
            'sender.profileImage': '$sender.profileImage',
          },
        },
      ])
      .exec();
    return messages;
  }

  async getMessageById(messageId: string): Promise<CommunityMessage | null> {
    return this._communityMessageModel
      .findById(messageId)
      .populate('sender', 'fullname email')
      .exec();
  }

  async leaveCommunity(
    communityId: string,
    userId: string,
  ): Promise<Community | null> {
    return this._communityModel
      .findByIdAndUpdate(communityId, {
        $pull: { members: new Types.ObjectId(userId) },
      })
      .exec();
  }
}
