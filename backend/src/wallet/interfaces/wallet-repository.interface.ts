import { Wallet } from '../models/wallet.schema';
import { WalletTransaction, WalletTransactionType } from '../models/wallet-transaction.schema';

export const IWalletRepositoryToken = Symbol('IWalletRepository')

export interface IWalletRepository {
  findWalletByUserId(userId: string): Promise<Wallet | null>;
  createWallet(userId: string): Promise<Wallet>;
  updateWalletBalance(userId: string, amount: number): Promise<Wallet>;
  findTransactions(
    userId: string,
    page: number,
    limit: number,
    startDate?: string,
    endDate?: string
  ): Promise<WalletTransaction[]>;
  createTransaction(userId: string, walletId: string, amount: number, type: WalletTransactionType, description: string): Promise<WalletTransaction>;
  countTransactions(query: any): Promise<number>;
}