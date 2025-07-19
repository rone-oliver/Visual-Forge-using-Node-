import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/users/models/user.schema';
import { RelationshipType } from '../enums/relationships.enum';
import { GetRelatedUsersDto, RelationshipDto } from './dto/relationship.dto';
import { IRelationshipRepository, IRelationshipRepositoryToken } from './interfaces/repository.interface';
import { IRelationshipService } from './interfaces/service.interface';
import { Relationship } from './models/relationships.schema';
import { IUsersService, IUsersServiceToken } from 'src/users/interfaces/users.service.interface';

@Injectable()
export class RelationshipService implements IRelationshipService {
  constructor(
    @Inject(IRelationshipRepositoryToken) private readonly _relationshipRepository: IRelationshipRepository,
    @Inject(IUsersServiceToken) private readonly _userService: IUsersService,
  ) {}

  async createRelationship(dto: RelationshipDto): Promise<Relationship> {
    const { sourceUser, targetUser, type } = dto;

    if (sourceUser.equals(targetUser)) {
      throw new ConflictException('A user cannot create a relationship with themselves.');
    }

    const [sourceUserExists, targetUserExists] = await Promise.all([
      this._userService.isExistingUser(sourceUser),
      this._userService.isExistingUser(targetUser),
    ]);

    if (!sourceUserExists) throw new NotFoundException('Source user not found.');
    if (!targetUserExists) throw new NotFoundException('Target user not found.');

    try {
      return await this._relationshipRepository.create(dto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(`Relationship '${type}' already exists between these users.`);
      }
      throw error;
    }
  }

  async removeRelationship(dto: RelationshipDto): Promise<{ deletedCount: number }> {
    const result = await this._relationshipRepository.deleteOne(dto);

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Relationship '${dto.type}' not found between these users.`);
    }
    return result;
  }

  async isFollowing(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<boolean> {
    const count = await this._relationshipRepository.count({
      sourceUser: followerId,
      targetUser: followingId,
      type: RelationshipType.FOLLOWS,
    });
    return count > 0;
  }

  async isBlocking(blockerId: Types.ObjectId, blockedId: Types.ObjectId): Promise<boolean> {
    const count = await this._relationshipRepository.count({
      sourceUser: blockerId,
      targetUser: blockedId,
      type: RelationshipType.BLOCKS,
    });
    return count > 0;
  }

  async getFollowerCount(userId: Types.ObjectId): Promise<number> {
    return this._relationshipRepository.countFollowers(userId);
  }

  async getFollowingCount(userId: Types.ObjectId): Promise<number> {
    return this._relationshipRepository.countFollowing(userId);
  }

  async getFollowing({ userId, limit, skip }: GetRelatedUsersDto): Promise<UserDocument[]> {
    return this._relationshipRepository.findFollows(userId, limit, skip);
  }

  async getFollowers({ userId, limit, skip }: GetRelatedUsersDto): Promise<UserDocument[]> {
    return this._relationshipRepository.findFollowers(userId, limit, skip);
  }

  async getBlockedUsers({ userId, limit, skip }: GetRelatedUsersDto): Promise<UserDocument[]> {
    return this._relationshipRepository.findBlockedUsers(userId, limit, skip);
  }

  async getBlockersOfUser({ userId, limit, skip }: GetRelatedUsersDto): Promise<UserDocument[]> {
    return this._relationshipRepository.findBlockersOfUser(userId, limit, skip);
  }
}