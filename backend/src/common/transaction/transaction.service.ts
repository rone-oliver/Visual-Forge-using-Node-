import { Inject, Injectable } from '@nestjs/common';
import { ITransactionService } from './interfaces/transaction.service.interface';
import { ITransactionRepository, ITransactionRepositoryToken } from './interfaces/transaction.repository.interface';
import { Transaction } from './models/transaction.schema';
import { IFindOptions } from './dtos/transaction.dto';

@Injectable()
export class TransactionService implements ITransactionService {

    constructor(
        @Inject(ITransactionRepositoryToken) private readonly _transactionRepository: ITransactionRepository
    ) {}

    async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
        return this._transactionRepository.create(transactionData);
    }

    async getTransactions(conditions: any, options?: IFindOptions): Promise<Transaction[]> {
        return this._transactionRepository.find(conditions, options);
    }

    async countTransactions(conditions: any): Promise<number> {
        return this._transactionRepository.count(conditions);
    }

    async getTransactionsByQuotationId(quotationId: string): Promise<Transaction[]> {
        return this._transactionRepository.findByQuotationId(quotationId);
    }
}