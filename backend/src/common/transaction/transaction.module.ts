import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ITransactionServiceToken } from './interfaces/transaction.service.interface';
import { TransactionRepository } from './repositories/transaction.repository';
import { ITransactionRepositoryToken } from './interfaces/transaction.repository.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './models/transaction.schema';

@Module({
  providers: [
    {
      provide: ITransactionServiceToken,
      useClass: TransactionService,
    },
    {
      provide: ITransactionRepositoryToken,
      useClass: TransactionRepository,
    }
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ])
  ],
  exports: [ITransactionServiceToken, ITransactionRepositoryToken]
})
export class TransactionModule {}
