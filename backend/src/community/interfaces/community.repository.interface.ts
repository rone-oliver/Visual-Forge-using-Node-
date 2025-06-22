import { CreateCommunityDto } from '../dto/community.dto';
import { Community } from '../models/community.schema';
import { CommunityMessage } from '../models/community-message.schema';

export const ICommunityRepositoryToken = Symbol('ICommunityRepository');

export interface ICommunityRepository {
  create(createCommunityDto: CreateCommunityDto, creatorId: string): Promise<Community>;
  findAll(): Promise<Community[]>;
  findById(id: string): Promise<Community>;
  addMember(communityId: string, userId: string): Promise<Community>;
  addMessage(communityId: string, senderId: string, content: string): Promise<CommunityMessage>;
  getMessages(communityId: string, limit: number): Promise<CommunityMessage[]>;
  isUserMember(communityId: string, userId: string): Promise<boolean>;
  getMessageById(messageId: string): Promise<CommunityMessage | null>;
  leaveCommunity(communityId: string, userId: string): Promise<Community | null>;
}