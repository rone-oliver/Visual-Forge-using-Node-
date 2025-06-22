import { Inject, Injectable } from '@nestjs/common';
import { ICommunityService } from './interfaces/community.service.interface';
import { CreateCommunityDto } from './dto/community.dto';
import { Community } from './models/community.schema';
import { CommunityMessage } from './models/community-message.schema';
import { ICommunityRepository, ICommunityRepositoryToken } from './interfaces/community.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommunityService implements ICommunityService {
  constructor(
    @Inject(ICommunityRepositoryToken) private readonly communityRepository: ICommunityRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createCommunityDto: CreateCommunityDto, creatorId: string): Promise<Community> {
    const community = await this.communityRepository.create(createCommunityDto, creatorId);
    this.eventEmitter.emit('community.created', community);
    return community;
  }

  async findAll(): Promise<Community[]> {
    return this.communityRepository.findAll();
  }

  async findById(id: string): Promise<Community> {
    return this.communityRepository.findById(id);
  }

  async addMember(communityId: string, userId: string): Promise<Community> {
    const community = await this.communityRepository.addMember(communityId, userId);
    this.eventEmitter.emit('community.member.joined', { communityId, userId });
    return community;
  }

  async sendMessage(communityId: string, senderId: string, content: string): Promise<CommunityMessage> {
    return this.communityRepository.addMessage(communityId, senderId, content);
  }

  async getMessageById(messageId: string): Promise<CommunityMessage | null> {
    return this.communityRepository.getMessageById(messageId);
  }

  async getMessages(communityId: string, limit: number = 50): Promise<CommunityMessage[]> {
    return this.communityRepository.getMessages(communityId, limit);
  }

  async isUserMember(communityId: string, userId: string): Promise<boolean> {
    return this.communityRepository.isUserMember(communityId, userId);
  }

  async leaveCommunity(communityId: string, userId: string): Promise<Community | null> {
    return this.communityRepository.leaveCommunity(communityId, userId);
  }
}
