import { Module } from '@nestjs/common';
import { EditorsService } from './editors.service';
import { EditorsController } from './editors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Editor, editorSchema } from './models/editor.schema';
import { Quotation, QuotationSchema } from 'src/common/models/quotation.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { Works, workSchema } from 'src/common/models/works.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { UsersModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';
import { Bid, BidSchema } from 'src/common/bids/models/bids.schema';
import { BidsModule } from 'src/common/bids/bids.module';
import { IEditorsServiceToken } from './interfaces/editors.service.interface';
import { RelationshipModule } from 'src/common/relationship/relationship.module';

@Module({
  providers: [
    { 
      provide: IEditorsServiceToken, 
      useClass: EditorsService 
    },
    CloudinaryService
  ],
  controllers: [EditorsController],
  imports:[
    UsersModule, NotificationModule, BidsModule, RelationshipModule,
    MongooseModule.forFeature([
      { name: Editor.name, schema: editorSchema},
      { name: Quotation.name, schema: QuotationSchema},
      { name: Works.name, schema: workSchema},
      { name: User.name, schema: userSchema},
      { name: Bid.name, schema: BidSchema}
    ])
  ],
  exports: [IEditorsServiceToken]
})
export class EditorsModule {}
