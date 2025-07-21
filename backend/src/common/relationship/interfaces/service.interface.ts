import { Types } from 'mongoose';
import { UserDocument } from 'src/users/models/user.schema';

import { GetRelatedUsersDto, RelationshipDto } from '../dto/relationship.dto';
import { Relationship } from '../models/relationships.schema';

export const IRelationshipServiceToken = Symbol('IRelationshipService');

export interface IRelationshipService {
  createRelationship(dto: RelationshipDto): Promise<Relationship>;

  removeRelationship(dto: RelationshipDto): Promise<{ deletedCount: number }>;

  isFollowing(
    followerId: Types.ObjectId,
    followingId: Types.ObjectId,
  ): Promise<boolean>;

  isBlocking(
    blockerId: Types.ObjectId,
    blockedId: Types.ObjectId,
  ): Promise<boolean>;

  getFollowerCount(userId: Types.ObjectId): Promise<number>;

  getFollowingCount(userId: Types.ObjectId): Promise<number>;

  getFollowing(dto: GetRelatedUsersDto): Promise<UserDocument[]>;

  getFollowers(dto: GetRelatedUsersDto): Promise<UserDocument[]>;

  getBlockedUsers(dto: GetRelatedUsersDto): Promise<UserDocument[]>;

  getBlockersOfUser(dto: GetRelatedUsersDto): Promise<UserDocument[]>;
}
