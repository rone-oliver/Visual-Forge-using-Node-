import { IFindOptions } from "../dtos/transaction.dto";
import { Transaction } from "../models/transaction.schema";

export const ITransactionServiceToken = 'ITransactionService';

export interface ITransactionService {
    createTransaction(transactionData: Partial<Transaction>): Promise<Transaction>;
    getTransactions(conditions: any, options?: IFindOptions): Promise<Transaction[]>;
    countTransactions(conditions: any): Promise<number>;
    getTransactionsByQuotationId(quotationId: string): Promise<Transaction[]>;
}