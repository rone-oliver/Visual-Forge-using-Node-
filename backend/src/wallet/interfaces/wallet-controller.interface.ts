import { TransactionResponseDto } from 'src/users/dto/users.dto';

import {
  GetTransactionsDto,
  PaginatedWalletTransactionsResponseDto,
  PayFromWalletDto,
  UpdateWalletDto,
} from '../dto/wallet.dto';
import { Wallet } from '../models/wallet.schema';

export interface IWalletController {
  getWallet(userId: string): Promise<Wallet>;
  getTransactions(
    userId: string,
    query: GetTransactionsDto,
  ): Promise<PaginatedWalletTransactionsResponseDto>;
  addMoney(userId: string, body: UpdateWalletDto): Promise<Wallet>;
  withdrawMoney(userId: string, body: UpdateWalletDto): Promise<Wallet>;
  payFromWallet(
    userId: string,
    body: PayFromWalletDto,
  ): Promise<TransactionResponseDto>;
}
