import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsModule } from 'src/common/bids/bids.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { PaymentModule } from 'src/common/payment/payment.module';
import { RelationshipModule } from 'src/common/relationship/relationship.module';
import { TransactionModule } from 'src/common/transaction/transaction.module';
import { EditorsModule } from 'src/editors/editors.module';
import { QuotationModule } from 'src/quotation/quotation.module';
import { ReportsModule } from 'src/reports/reports.module';
import { TimelineModule } from 'src/timeline/timeline.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { WorksModule } from 'src/works/works.module';

import { IUserEditorServiceToken } from './interfaces/services/user-editor.service.interface';
import { IUserProfileServiceToken } from './interfaces/services/user-profile.service.interface';
import { IUserQuotationServiceToken } from './interfaces/services/user-quotation.service.interface';
import { IUsersServiceToken } from './interfaces/services/users.service.interface';
import { IUserRepositoryToken } from './interfaces/users.repository.interface';
import { User, userSchema } from './models/user.schema';
import { UserRepository } from './repositories/user.repository';
import { UserEditorService } from './services/user-editor.service';
import { UserProfileService } from './services/user-profile.service';
import { UserQuotationService } from './services/user-quotation.service';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: IUsersServiceToken,
      useClass: UsersService,
    },
    {
      provide: IUserQuotationServiceToken,
      useClass: UserQuotationService,
    },
    {
      provide: IUserProfileServiceToken,
      useClass: UserProfileService,
    },
    {
      provide: IUserEditorServiceToken,
      useClass: UserEditorService,
    },
    {
      provide: IUserRepositoryToken,
      useClass: UserRepository,
    },
  ],
  imports: [
    forwardRef(() => EditorsModule),
    MongooseModule.forFeature([{ name: User.name, schema: userSchema }]),
    PaymentModule,
    BidsModule,
    WalletModule,
    forwardRef(() => RelationshipModule),
    CloudinaryModule,
    QuotationModule,
    WorksModule,
    ReportsModule,
    TransactionModule,
    HashingModule,
    TimelineModule,
  ],
  exports: [IUsersServiceToken, IUserRepositoryToken],
})
export class UsersModule {}
