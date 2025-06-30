import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { EditorRequest, EditorRequestSchema } from 'src/common/models/editorRequest.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';
import { Quotation, QuotationSchema } from 'src/common/models/quotation.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { Works, workSchema } from 'src/common/models/works.schema';
import { EditorsService } from 'src/editors/editors.service';
import { PaymentModule } from 'src/common/payment/payment.module';
import { Transaction, TransactionSchema } from 'src/common/models/transaction.schema';
import { Bid, BidSchema } from 'src/common/bids/models/bids.schema';
import { BidsModule } from 'src/common/bids/bids.module';
import { IUsersServiceToken } from './interfaces/users.service.interface';
import { Report, ReportSchema } from 'src/common/models/report.schema';
import { WalletModule } from 'src/wallet/wallet.module';
import { RelationshipModule } from 'src/common/relationship/relationship.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: IUsersServiceToken,
      useClass: UsersService,
    },
    CloudinaryService, EditorsService
  ],
  imports:[
    MongooseModule.forFeature([
      { name:User.name, schema: userSchema},
      { name: EditorRequest.name, schema: EditorRequestSchema},
      { name: Editor.name, schema: editorSchema},
      { name: Quotation.name , schema: QuotationSchema},
      { name: Works.name, schema: workSchema},
      { name: Transaction.name, schema: TransactionSchema},
      { name: Bid.name, schema: BidSchema},
      { name: Report.name, schema: ReportSchema },
    ]),
    PaymentModule, BidsModule, WalletModule, RelationshipModule, CloudinaryModule
  ],
  exports: [IUsersServiceToken,]
})
export class UsersModule {}
