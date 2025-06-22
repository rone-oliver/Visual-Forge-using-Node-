import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Community, CommunitySchema } from './models/community.schema';
import { CommunityGateway } from './community.gateway';
import { CommunityRepository } from './repositories/community.repository';
import { ICommunityRepositoryToken } from './interfaces/community.repository.interface';
import { ICommunityServiceToken } from './interfaces/community.service.interface';
import { CommunityMessage, CommunityMessageSchema } from './models/community-message.schema';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [CommunityController],
  providers: [
    {
      provide: ICommunityServiceToken,
      useClass: CommunityService
    },
    {
      provide: ICommunityRepositoryToken,
      useClass: CommunityRepository
    },
    CommunityGateway
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: CommunityMessage.name, schema: CommunityMessageSchema }
    ]),
    JwtModule.register({}),UsersModule
  ],
  exports: [ICommunityServiceToken]
})
export class CommunityModule {}
