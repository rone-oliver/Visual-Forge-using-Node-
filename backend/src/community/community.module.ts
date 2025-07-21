import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';

import { CommunityController } from './community.controller';
import { CommunityGateway } from './community.gateway';
import { CommunityService } from './community.service';
import { ICommunityRepositoryToken } from './interfaces/community.repository.interface';
import { ICommunityServiceToken } from './interfaces/community.service.interface';
import {
  CommunityMessage,
  CommunityMessageSchema,
} from './models/community-message.schema';
import { Community, CommunitySchema } from './models/community.schema';
import { CommunityRepository } from './repositories/community.repository';

@Module({
  controllers: [CommunityController],
  providers: [
    {
      provide: ICommunityServiceToken,
      useClass: CommunityService,
    },
    {
      provide: ICommunityRepositoryToken,
      useClass: CommunityRepository,
    },
    CommunityGateway,
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: CommunityMessage.name, schema: CommunityMessageSchema },
    ]),
    JwtModule.register({}),
    UsersModule,
  ],
  exports: [ICommunityServiceToken],
})
export class CommunityModule {}
