import { Wallet } from '../models/wallet.schema';
import { PaginatedWalletTransactionsResponseDto } from '../dto/wallet.dto';

export const IWalletServiceToken = Symbol('IWalletService')

export interface IWalletService {
  getWallet(userId: string): Promise<Wallet>;
  getTransactions(userId: string, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<PaginatedWalletTransactionsResponseDto>;
  addMoney(userId: string, amount: number): Promise<Wallet>;
  withdrawMoney(userId: string, amount: number): Promise<Wallet>;
  creditEditorWallet(userId: string, amount: number, quotationId: string): Promise<boolean>;
  refundUserForExpiredQuotation(userId: string, quotationId: string, amount: number): Promise<boolean>;
}