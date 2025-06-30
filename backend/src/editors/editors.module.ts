import { forwardRef, Module } from '@nestjs/common';
import { EditorsService } from './editors.service';
import { EditorsController } from './editors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Editor, editorSchema } from './models/editor.schema';
import { Quotation, QuotationSchema } from 'src/quotation/models/quotation.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { Works, workSchema } from 'src/common/models/works.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { UsersModule } from 'src/users/users.module';
import { Bid, BidSchema } from 'src/common/bids/models/bids.schema';
import { BidsModule } from 'src/common/bids/bids.module';
import { IEditorsServiceToken } from './interfaces/editors.service.interface';
import { RelationshipModule } from 'src/common/relationship/relationship.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { EditorRequestsRepository } from './repositories/editorRequest.repository';
import { IEditorRequestsRepositoryToken } from './interfaces/editorRequests.repository.interface';
import { EditorRequest, EditorRequestSchema } from 'src/editors/models/editorRequest.schema';
import { IEditorRepositoryToken } from './interfaces/editor.repository.interface';
import { EditorRepository } from './repositories/editor.repository';

@Module({
  providers: [
    { 
      provide: IEditorsServiceToken, 
      useClass: EditorsService 
    },
    {
      provide: IEditorRequestsRepositoryToken,
      useClass: EditorRequestsRepository
    },
    {
      provide: IEditorRepositoryToken,
      useClass: EditorRepository
    }
  ],
  controllers: [EditorsController],
  imports:[
    forwardRef(() => UsersModule), BidsModule, RelationshipModule, CloudinaryModule,
    MongooseModule.forFeature([
      { name: Editor.name, schema: editorSchema},
      { name: EditorRequest.name, schema: EditorRequestSchema },
      { name: Quotation.name, schema: QuotationSchema},
      { name: Works.name, schema: workSchema},
      { name: User.name, schema: userSchema},
      { name: Bid.name, schema: BidSchema},
    ])
  ],
  exports: [IEditorsServiceToken, IEditorRequestsRepositoryToken, IEditorRepositoryToken]
})
export class EditorsModule {}
