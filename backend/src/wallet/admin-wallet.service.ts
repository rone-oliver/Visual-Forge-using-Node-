import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { FinancialSummaryDto } from 'src/admins/dto/admin.dto';
import {
  IPaymentService,
  IPaymentServiceToken,
} from 'src/common/payment/interfaces/payment-service.interface';
import { Quotation } from 'src/quotation/models/quotation.schema';

import { PaginatedLedgerResponseDto } from './dto/wallet.dto';
import {
  IAdminTransactionRepository,
  IAdminTransactionRepositoryToken,
} from './interfaces/admin-transaction.repository.interface';
import { IAdminWalletService } from './interfaces/admin-wallet.service.interface';
import {
  IWalletService,
  IWalletServiceToken,
} from './interfaces/wallet-service.interface';
import {
  AdminTransactionType,
  TransactionFlow,
} from './models/admin-transaction.schema';

@Injectable()
export class AdminWalletService implements IAdminWalletService {
  constructor(
    @Inject(IAdminTransactionRepositoryToken)
    private readonly _adminTransactionRepository: IAdminTransactionRepository,
    @Inject(IWalletServiceToken)
    private readonly _walletService: IWalletService,
    @Inject(IPaymentServiceToken)
    private readonly _paymentService: IPaymentService,
  ) {}

  async creditWelcomeBonus(userId: string): Promise<void> {
    const bonusAmount = 100; // Welcome bonus amount

    await this._walletService.addMoney(userId, bonusAmount);

    await this._adminTransactionRepository.create({
      flow: TransactionFlow.DEBIT,
      amount: bonusAmount,
      transactionType: AdminTransactionType.WELCOME_BONUS,
      user: new Types.ObjectId(userId),
    });
  }

  async recordUserPayment(
    quotation: Quotation,
    paymentId: string,
  ): Promise<void> {
    const totalAmount = quotation.estimatedBudget;
    const commissionRate = 0.1; // 10% commission
    const commission = totalAmount * commissionRate;
    const editorShare = totalAmount - commission;

    await this._adminTransactionRepository.create({
      flow: TransactionFlow.CREDIT,
      amount: totalAmount,
      transactionType: AdminTransactionType.USER_PAYMENT,
      user: new Types.ObjectId(quotation.userId),
      editor: new Types.ObjectId(quotation.editorId),
      quotation: new Types.ObjectId(quotation._id),
      commission,
      paymentId,
    });

    await this._walletService.creditEditorWallet(
      quotation.editorId.toString(),
      editorShare,
      quotation._id.toString(),
    );

    await this._adminTransactionRepository.create({
      flow: TransactionFlow.DEBIT,
      amount: editorShare,
      transactionType: AdminTransactionType.EDITOR_PAYOUT,
      editor: new Types.ObjectId(quotation.editorId),
      quotation: new Types.ObjectId(quotation._id),
    });
  }

  async getLedger(
    page: number,
    limit: number,
  ): Promise<PaginatedLedgerResponseDto> {
    const skip = (page - 1) * limit;
    const [transactions, totalItems, balance] = await Promise.all([
      this._adminTransactionRepository.findAll({ skip, limit }),
      this._adminTransactionRepository.count(),
      this._paymentService.getAccountBalance(),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return {
      transactions,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      totalBalance: balance,
    };
  }

  async getTransactionCountByFlow(): Promise<{
    credit: number;
    debit: number;
  }> {
    return this._adminTransactionRepository.getTransactionCountByFlow();
  }

  async getFinancialSummary(): Promise<FinancialSummaryDto> {
    const { totalRevenue, totalPlatformFee, totalPayouts } =
      await this._adminTransactionRepository.getFinancialSummary();
    const netProfit = totalRevenue - totalPayouts;

    return {
      totalRevenue,
      totalPlatformFee,
      totalPayouts,
      netProfit,
    };
  }
}
