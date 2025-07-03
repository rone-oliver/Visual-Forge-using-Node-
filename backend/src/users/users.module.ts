import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { EditorRequest, EditorRequestSchema } from 'src/editors/models/editorRequest.schema';
import { Editor, editorSchema } from 'src/editors/models/editor.schema';
import { Quotation, QuotationSchema } from 'src/quotation/models/quotation.schema';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { Works, workSchema } from 'src/works/models/works.schema';
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
import { IPaymentServiceToken } from 'src/common/payment/interfaces/payment-service.interface';
import { EditorsModule } from 'src/editors/editors.module';
import { IUserRepositoryToken } from './interfaces/users.repository.interface';
import { UserRepository } from './repositories/user.repository';
import { QuotationModule } from 'src/quotation/quotation.module';
import { WorksModule } from 'src/works/works.module';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: IUsersServiceToken,
      useClass: UsersService,
    },
    {
      provide: IUserRepositoryToken,
      useClass: UserRepository
    },
    EditorsService
  ],
  imports:[
    forwardRef(() => EditorsModule),
    MongooseModule.forFeature([
      { name:User.name, schema: userSchema},
      { name: EditorRequest.name, schema: EditorRequestSchema},
      { name: Editor.name, schema: editorSchema},
      { name: Quotation.name , schema: QuotationSchema},
      { name: Transaction.name, schema: TransactionSchema},
      { name: Report.name, schema: ReportSchema },
    ]),
    PaymentModule, BidsModule, WalletModule, RelationshipModule, CloudinaryModule, QuotationModule, WorksModule,
  ],
  exports: [IUsersServiceToken, IUserRepositoryToken]
})
export class UsersModule {}
