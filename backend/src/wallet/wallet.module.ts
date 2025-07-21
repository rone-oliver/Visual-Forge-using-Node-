import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentModule } from 'src/common/payment/payment.module';
import { TransactionModule } from 'src/common/transaction/transaction.module';
import { QuotationModule } from 'src/quotation/quotation.module';
import { UsersModule } from 'src/users/users.module';

import { AdminWalletController } from './admin-wallet.controller';
import { AdminWalletService } from './admin-wallet.service';
import { IAdminTransactionRepositoryToken } from './interfaces/admin-transaction.repository.interface';
import { IAdminWalletServiceToken } from './interfaces/admin-wallet.service.interface';
import { IWalletRepositoryToken } from './interfaces/wallet-repository.interface';
import { IWalletServiceToken } from './interfaces/wallet-service.interface';
import {
  AdminTransaction,
  AdminTransactionSchema,
} from './models/admin-transaction.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from './models/wallet-transaction.schema';
import { Wallet, WalletSchema } from './models/wallet.schema';
import { AdminTransactionRepository } from './repositories/admin-transaction.repository';
import { WalletRepository } from './repositories/wallet.repository';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: AdminTransaction.name, schema: AdminTransactionSchema },
    ]),
    forwardRef(() => UsersModule),
    PaymentModule,
    QuotationModule,
    TransactionModule,
  ],
  controllers: [WalletController, AdminWalletController],
  providers: [
    {
      provide: IWalletServiceToken,
      useClass: WalletService,
    },
    {
      provide: IWalletRepositoryToken,
      useClass: WalletRepository,
    },
    {
      provide: IAdminWalletServiceToken,
      useClass: AdminWalletService,
    },
    {
      provide: IAdminTransactionRepositoryToken,
      useClass: AdminTransactionRepository,
    },
  ],
  exports: [IWalletServiceToken, IAdminWalletServiceToken],
})
export class WalletModule {}
