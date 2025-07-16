import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { PaymentModule } from 'src/common/payment/payment.module';
import { BidsModule } from 'src/common/bids/bids.module';
import { IUsersServiceToken } from './interfaces/users.service.interface';
import { WalletModule } from 'src/wallet/wallet.module';
import { RelationshipModule } from 'src/common/relationship/relationship.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { EditorsModule } from 'src/editors/editors.module';
import { IUserRepositoryToken } from './interfaces/users.repository.interface';
import { UserRepository } from './repositories/user.repository';
import { QuotationModule } from 'src/quotation/quotation.module';
import { WorksModule } from 'src/works/works.module';
import { ReportsModule } from 'src/reports/reports.module';
import { TransactionModule } from 'src/common/transaction/transaction.module';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { TimelineModule } from 'src/timeline/timeline.module';

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
  ],
  imports:[
    forwardRef(() => EditorsModule),
    MongooseModule.forFeature([
      { name:User.name, schema: userSchema},
    ]),
    PaymentModule, BidsModule, WalletModule, RelationshipModule,
    CloudinaryModule, QuotationModule, WorksModule, ReportsModule,
    TransactionModule, HashingModule, TimelineModule,
  ],
  exports: [IUsersServiceToken, IUserRepositoryToken]
})
export class UsersModule {}
