import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';

import { IRelationshipRepositoryToken } from './interfaces/repository.interface';
import { IRelationshipServiceToken } from './interfaces/service.interface';
import {
  Relationship,
  RelationshipSchema,
} from './models/relationships.schema';
import { RelationshipService } from './relationship.service';
import { RelationshipRepository } from './repositories/relationship.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Relationship.name, schema: RelationshipSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [
    {
      provide: IRelationshipRepositoryToken,
      useClass: RelationshipRepository,
    },
    {
      provide: IRelationshipServiceToken,
      useClass: RelationshipService,
    },
  ],
  exports: [IRelationshipServiceToken],
})
export class RelationshipModule {}
