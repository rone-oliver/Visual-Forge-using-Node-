import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { EditorRequestSchema } from 'src/common/models/editorRequest.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';
import { Quotation, QuotationSchema } from 'src/common/models/quotation.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { Works, workSchema } from 'src/common/models/works.schema';
import { EditorsService } from 'src/editors/editors.service';
import { PaymentModule } from 'src/common/payment/payment.module';
import { Transaction, TransactionSchema } from 'src/common/models/transaction.schema';
import { NotificationModule } from 'src/notification/notification.module';
import { Bid, BidSchema } from 'src/common/models/bids.schema';
import { BidsModule } from 'src/common/bids/bids.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService, EditorsService],
  imports:[
    MongooseModule.forFeature([
      { name:User.name, schema: userSchema},
      { name: 'EditorRequest', schema: EditorRequestSchema},
      { name: Editor.name, schema: editorSchema},
      { name: Quotation.name , schema: QuotationSchema},
      { name: Works.name, schema: workSchema},
      { name: Transaction.name, schema: TransactionSchema},
      { name: Bid.name, schema: BidSchema}
    ]),
    PaymentModule, BidsModule,
    forwardRef(()=> NotificationModule)
  ],
  exports: [UsersService]
})
export class UsersModule {}
