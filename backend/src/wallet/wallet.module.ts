import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './models/wallet.schema';
import { WalletTransaction, WalletTransactionSchema } from './models/wallet-transaction.schema';
import { IWalletServiceToken } from './interfaces/wallet-service.interface';
import { IWalletRepositoryToken } from './interfaces/wallet-repository.interface';
import { WalletRepository } from './repositories/wallet.repository';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema }
    ]),
    UsersModule,
  ],
  controllers: [WalletController],
  providers: [
    {
      provide: IWalletServiceToken,
      useClass: WalletService,
    },
    {
      provide: IWalletRepositoryToken,
      useClass: WalletRepository
    }
  ],
  exports: [IWalletServiceToken]
})
export class WalletModule {}
