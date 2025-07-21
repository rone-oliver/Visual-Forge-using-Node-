import { CreateCommunityDto } from '../dto/community.dto';
import { CommunityMessage } from '../models/community-message.schema';
import { Community } from '../models/community.schema';

export const ICommunityServiceToken = Symbol('ICommunityService');

export interface ICommunityService {
  create(
    createCommunityDto: CreateCommunityDto,
    creatorId: string,
  ): Promise<Community>;
  findAll(): Promise<Community[]>;
  findById(id: string): Promise<Community>;
  addMember(communityId: string, userId: string): Promise<Community>;
  sendMessage(
    communityId: string,
    senderId: string,
    content: string,
  ): Promise<CommunityMessage>;
  getMessages(communityId: string): Promise<CommunityMessage[]>;
  isUserMember(communityId: string, userId: string): Promise<boolean>;
  getMessageById(messageId: string): Promise<CommunityMessage | null>;
  leaveCommunity(
    communityId: string,
    userId: string,
  ): Promise<Community | null>;
}
