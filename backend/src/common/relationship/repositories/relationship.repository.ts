import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { RelationshipType } from 'src/common/enums/relationships.enum';
import { UserDocument } from 'src/users/models/user.schema';

import { RelationshipDto } from '../dto/relationship.dto';
import { IRelationshipRepository } from '../interfaces/repository.interface';
import {
  Relationship,
  RelationshipDocument,
} from '../models/relationships.schema';

@Injectable()
export class RelationshipRepository implements IRelationshipRepository {
  constructor(
    @InjectModel(Relationship.name)
    private readonly _relationshipModel: Model<RelationshipDocument>,
  ) {}

  async create(relationshipDto: RelationshipDto): Promise<Relationship> {
    const newRelationship = new this._relationshipModel(relationshipDto);
    return newRelationship.save();
  }

  async findOne(
    filter: FilterQuery<RelationshipDocument>,
  ): Promise<Relationship | null> {
    return this._relationshipModel.findOne(filter).exec();
  }

  async deleteOne(
    filter: FilterQuery<RelationshipDocument>,
  ): Promise<{ deletedCount: number }> {
    const result = await this._relationshipModel.deleteOne(filter).exec();
    return { deletedCount: result.deletedCount };
  }

  async count(filter: FilterQuery<RelationshipDocument>): Promise<number> {
    return this._relationshipModel.countDocuments(filter).exec();
  }

  async countFollowers(userId: Types.ObjectId): Promise<number> {
    return this.count({
      targetUser: userId,
      type: RelationshipType.FOLLOWS,
    });
  }

  async countFollowing(userId: Types.ObjectId): Promise<number> {
    return this.count({
      sourceUser: userId,
      type: RelationshipType.FOLLOWS,
    });
  }

  private async _findRelatedUsers(
    userId: Types.ObjectId,
    type: RelationshipType,
    userField: 'sourceUser' | 'targetUser',
    populateField: 'sourceUser' | 'targetUser',
    limit: number,
    skip: number,
  ): Promise<UserDocument[]> {
    const relationships = await this._relationshipModel
      .find({ [userField]: userId, type })
      .populate(populateField, 'username profileImage')
      .limit(limit)
      .skip(skip)
      .exec();

    return relationships.map(
      (rel) => rel[populateField] as unknown as UserDocument,
    );
  }

  async findFollows(
    userId: Types.ObjectId,
    limit: number,
    skip: number,
  ): Promise<UserDocument[]> {
    return this._findRelatedUsers(
      userId,
      RelationshipType.FOLLOWS,
      'sourceUser',
      'targetUser',
      limit,
      skip,
    );
  }

  async findFollowers(
    userId: Types.ObjectId,
    limit: number,
    skip: number,
  ): Promise<UserDocument[]> {
    return this._findRelatedUsers(
      userId,
      RelationshipType.FOLLOWS,
      'targetUser',
      'sourceUser',
      limit,
      skip,
    );
  }

  async findBlockedUsers(
    userId: Types.ObjectId,
    limit: number,
    skip: number,
  ): Promise<UserDocument[]> {
    return this._findRelatedUsers(
      userId,
      RelationshipType.BLOCKS,
      'sourceUser',
      'targetUser',
      limit,
      skip,
    );
  }

  async findBlockersOfUser(
    userId: Types.ObjectId,
    limit: number,
    skip: number,
  ): Promise<UserDocument[]> {
    return this._findRelatedUsers(
      userId,
      RelationshipType.BLOCKS,
      'targetUser',
      'sourceUser',
      limit,
      skip,
    );
  }
}
