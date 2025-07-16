import { Wallet } from '../models/wallet.schema';
import { PaginatedWalletTransactionsResponseDto, PayFromWalletDto } from '../dto/wallet.dto';
import { TransactionResponseDto } from 'src/users/dto/users.dto';

export const IWalletServiceToken = Symbol('IWalletService')

export interface IWalletService {
  getWallet(userId: string): Promise<Wallet>;
  getTransactions(userId: string, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<PaginatedWalletTransactionsResponseDto>;
  addMoney(userId: string, amount: number): Promise<Wallet>;
  withdrawMoney(userId: string, amount: number): Promise<Wallet>;
  creditEditorWallet(userId: string, amount: number, quotationId: string): Promise<boolean>;
  refundUserForExpiredQuotation(userId: string, quotationId: string, amount: number): Promise<boolean>;
  payFromWallet(userId: string, payFromWalletDto: PayFromWalletDto): Promise<TransactionResponseDto>;
}