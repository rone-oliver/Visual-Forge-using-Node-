import { AdminTransaction } from '../models/admin-transaction.schema';

export const IAdminTransactionRepositoryToken = Symbol(
  'IAdminTransactionRepository',
);

export interface IAdminTransactionRepository {
  create(transactionDto: Partial<AdminTransaction>): Promise<AdminTransaction>;
  findAll(filter?: {
    skip?: number;
    limit?: number;
  }): Promise<AdminTransaction[]>;
  count(): Promise<number>;
  getTransactionCountByFlow(): Promise<{ credit: number; debit: number }>;
  getFinancialSummary(): Promise<{
    totalRevenue: number;
    totalPlatformFee: number;
    totalPayouts: number;
  }>;
}
