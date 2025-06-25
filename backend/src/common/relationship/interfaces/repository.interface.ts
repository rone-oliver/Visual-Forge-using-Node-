import { FilterQuery, Types } from 'mongoose';
import { Relationship, RelationshipDocument } from '../models/relationships.schema';
import { RelationshipDto } from '../dto/relationship.dto';
import { UserDocument } from 'src/users/models/user.schema';

export const IRelationshipRepositoryToken = Symbol('IRelationshipRepository');

export interface IRelationshipRepository {
  create(relationshipDto: RelationshipDto): Promise<Relationship>;

  findOne(filter: FilterQuery<RelationshipDocument>): Promise<Relationship | null>;

  deleteOne(filter: FilterQuery<RelationshipDocument>): Promise<{ deletedCount: number }>;

  count(filter: FilterQuery<RelationshipDocument>): Promise<number>;

  countFollowers(userId: Types.ObjectId): Promise<number>;

  countFollowing(userId: Types.ObjectId): Promise<number>;

  findFollows(userId: Types.ObjectId, limit: number, skip: number): Promise<UserDocument[]>;

  findFollowers(userId: Types.ObjectId, limit: number, skip: number): Promise<UserDocument[]>;

  findBlockedUsers(userId: Types.ObjectId, limit: number, skip: number): Promise<UserDocument[]>;

  findBlockersOfUser(userId: Types.ObjectId, limit: number, skip: number): Promise<UserDocument[]>;
}