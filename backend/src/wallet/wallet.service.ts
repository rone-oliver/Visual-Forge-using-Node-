import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IWalletRepository } from './interfaces/wallet-repository.interface';
import { IWalletService } from './interfaces/wallet-service.interface';
import { WalletTransactionType } from './models/wallet-transaction.schema';
import { IWalletRepositoryToken } from './interfaces/wallet-repository.interface';
import { PaginatedWalletTransactionsResponseDto } from './dto/wallet.dto';

@Injectable()
export class WalletService implements IWalletService {
  constructor(
      @Inject(IWalletRepositoryToken) private readonly walletRepo: IWalletRepository
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.walletRepo.findWalletByUserId(userId);
    if (!wallet) {
        wallet = await this.walletRepo.createWallet(userId);
    }
    return wallet;
  }

  async getTransactions(userId: string, page = 1, limit = 10, startDate?: string, endDate?: string): Promise<PaginatedWalletTransactionsResponseDto> {
    const wallet = await this.getWallet(userId);
    const query: any = { wallet: wallet._id };
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [transactions, total] = await Promise.all([
      this.walletRepo.findTransactions(query, page, limit),
      this.walletRepo.countTransactions(query),
    ]);

    return {
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addMoney(userId: string, amount: number) {
    if (amount <= 0) {
        throw new BadRequestException('Amount must be positive.');
    }

    const wallet = await this.getWallet(userId);
    const updatedWallet = await this.walletRepo.updateWalletBalance(userId, amount);

    await this.walletRepo.createTransaction(
        userId,
        wallet._id.toString(),
        amount,
        WalletTransactionType.CREDIT,
        'Funds added to wallet'
    );

    return updatedWallet;
  }

  async creditEditorWallet(userId: string, amount: number, quotationId: string) {
    if (amount <= 0) {
        throw new BadRequestException('Amount must be positive.');
    }

    const wallet = await this.getWallet(userId);
    const updatedWallet = await this.walletRepo.updateWalletBalance(userId, amount);

    await this.walletRepo.createTransaction(
        userId,
        wallet._id.toString(),
        amount,
        WalletTransactionType.CREDIT_FROM_WORK,
        `Payment from work #${quotationId}`
    );

    return updatedWallet;
  }

  async withdrawMoney(userId: string, amount: number) {
    if (amount <= 0) {
        throw new BadRequestException('Amount must be positive.');
    }

    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient funds.');
    }

    const updatedWallet = await this.walletRepo.updateWalletBalance(userId, -amount);

    await this.walletRepo.createTransaction(
        userId,
        wallet._id.toString(),
        amount,
        WalletTransactionType.DEBIT,
        'Funds withdrawn from wallet'
    );

    return updatedWallet;
  }
}