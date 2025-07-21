import { IFindOptions } from '../dtos/transaction.dto';
import { Transaction } from '../models/transaction.schema';

export const ITransactionRepositoryToken = 'ITransactionRepository';

export interface ITransactionRepository {
  create(transactionData: Partial<Transaction>): Promise<Transaction>;
  find(conditions: any, options?: IFindOptions): Promise<Transaction[]>;
  count(conditions: any): Promise<number>;
  findByQuotationId(quotationId: string): Promise<Transaction[]>;
}
