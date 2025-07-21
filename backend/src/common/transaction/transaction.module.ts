import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ITransactionRepositoryToken } from './interfaces/transaction.repository.interface';
import { ITransactionServiceToken } from './interfaces/transaction.service.interface';
import { Transaction, TransactionSchema } from './models/transaction.schema';
import { TransactionRepository } from './repositories/transaction.repository';
import { TransactionService } from './transaction.service';

@Module({
  providers: [
    {
      provide: ITransactionServiceToken,
      useClass: TransactionService,
    },
    {
      provide: ITransactionRepositoryToken,
      useClass: TransactionRepository,
    },
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  exports: [ITransactionServiceToken, ITransactionRepositoryToken],
})
export class TransactionModule {}
