import { forwardRef, Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { IRelationshipRepositoryToken } from './interfaces/repository.interface';
import { RelationshipRepository } from './repositories/relationship.repository';
import { IRelationshipServiceToken } from './interfaces/service.interface';
import { UsersModule } from 'src/users/users.module';
import { Relationship, RelationshipSchema } from './models/relationships.schema';
import { MongooseModule } from '@nestjs/mongoose';

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
    }
  ],
  exports: [IRelationshipServiceToken]
})
export class RelationshipModule {}
