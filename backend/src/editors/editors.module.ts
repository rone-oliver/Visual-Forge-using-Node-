import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsModule } from 'src/common/bids/bids.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { RelationshipModule } from 'src/common/relationship/relationship.module';
import {
  EditorRequest,
  EditorRequestSchema,
} from 'src/editors/models/editorRequest.schema';
import { QuotationModule } from 'src/quotation/quotation.module';
import { UsersModule } from 'src/users/users.module';
import { WorksModule } from 'src/works/works.module';

import { EditorsController } from './editors.controller';
import { EditorsService } from './services/editors.service';
import { IEditorRepositoryToken } from './interfaces/editor.repository.interface';
import { IEditorRequestsRepositoryToken } from './interfaces/editorRequests.repository.interface';
import { IEditorsServiceToken } from './interfaces/services/editors.service.interface';
import { Editor, editorSchema } from './models/editor.schema';
import { EditorRepository } from './repositories/editor.repository';
import { EditorRequestsRepository } from './repositories/editorRequest.repository';
import { IEditorRequestsServiceToken } from './interfaces/services/editor-requests.service.interface';
import { EditorRequestsService } from './services/editor-requests.service';
import { IEditorBidServiceToken } from './interfaces/services/editor-bid.service.interface';
import { EditorBidService } from './services/editor-bid.service';

@Module({
  providers: [
    {
      provide: IEditorsServiceToken,
      useClass: EditorsService,
    },
    {
      provide: IEditorRequestsServiceToken,
      useClass: EditorRequestsService,
    },
    {
      provide: IEditorBidServiceToken,
      useClass: EditorBidService,
    },
    {
      provide: IEditorRequestsRepositoryToken,
      useClass: EditorRequestsRepository,
    },
    {
      provide: IEditorRepositoryToken,
      useClass: EditorRepository,
    },
  ],
  controllers: [EditorsController],
  imports: [
    forwardRef(() => UsersModule),
    BidsModule,
    RelationshipModule,
    CloudinaryModule,
    QuotationModule,
    WorksModule,
    MongooseModule.forFeature([
      { name: Editor.name, schema: editorSchema },
      { name: EditorRequest.name, schema: EditorRequestSchema },
    ]),
  ],
  exports: [
    IEditorsServiceToken,
    IEditorRequestsRepositoryToken,
    IEditorRepositoryToken,
  ],
})
export class EditorsModule {}
