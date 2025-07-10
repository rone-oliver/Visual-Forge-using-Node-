import { Inject, Injectable } from '@nestjs/common';
import { AdminTransactionType, TransactionFlow } from './models/admin-transaction.schema';
import { Quotation } from 'src/quotation/models/quotation.schema';
import { IAdminTransactionRepository, IAdminTransactionRepositoryToken } from './interfaces/admin-transaction.repository.interface';
import { IAdminWalletService } from './interfaces/admin-wallet.service.interface';
import { IWalletService, IWalletServiceToken } from './interfaces/wallet-service.interface';
import { Types } from 'mongoose';
import { PaginatedLedgerResponseDto } from './dto/wallet.dto';
import { IPaymentService, IPaymentServiceToken } from 'src/common/payment/interfaces/payment-service.interface';

@Injectable()
export class AdminWalletService implements IAdminWalletService {
  constructor(
    @Inject(IAdminTransactionRepositoryToken) private readonly adminTransactionRepository: IAdminTransactionRepository,
    @Inject(IWalletServiceToken) private readonly walletService: IWalletService,
    @Inject(IPaymentServiceToken) private readonly paymentService: IPaymentService,
  ) {}

  async creditWelcomeBonus(userId: string): Promise<void> {
    const bonusAmount = 100; // Welcome bonus amount

    await this.walletService.addMoney(userId, bonusAmount);

    await this.adminTransactionRepository.create({
      flow: TransactionFlow.DEBIT,
      amount: bonusAmount,
      transactionType: AdminTransactionType.WELCOME_BONUS,
      user: new Types.ObjectId(userId),
    });
  }

  async recordUserPayment(quotation: Quotation, razorpayPaymentId: string): Promise<void> {
    const totalAmount = quotation.estimatedBudget;
    const commissionRate = 0.1; // 10% commission
    const commission = totalAmount * commissionRate;
    const editorShare = totalAmount - commission;

    await this.adminTransactionRepository.create({
      flow: TransactionFlow.CREDIT,
      amount: totalAmount,
      transactionType: AdminTransactionType.USER_PAYMENT,
      user: new Types.ObjectId(quotation.userId),
      editor: new Types.ObjectId(quotation.editorId),
      quotation: new Types.ObjectId(quotation._id),
      commission,
      razorpayPaymentId,
    });

    await this.walletService.creditEditorWallet(quotation.editorId.toString(), editorShare, quotation._id.toString());

    await this.adminTransactionRepository.create({
      flow: TransactionFlow.DEBIT,
      amount: editorShare,
      transactionType: AdminTransactionType.EDITOR_PAYOUT,
      editor: new Types.ObjectId(quotation.editorId),
      quotation: new Types.ObjectId(quotation._id),
    });
  }

  async getLedger(page: number, limit: number): Promise<PaginatedLedgerResponseDto> {
    const skip = (page - 1) * limit;
    const [transactions, totalItems, balance] = await Promise.all([
      this.adminTransactionRepository.findAll({ skip, limit }),
      this.adminTransactionRepository.count(),
      this.paymentService.getAccountBalance()
    ])
    const totalPages = Math.ceil(totalItems / limit);
    return {
      transactions,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      totalBalance: balance
    };
  }
}