import { Injectable, BadRequestException, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import { IWalletRepository } from './interfaces/wallet-repository.interface';
import { IWalletService } from './interfaces/wallet-service.interface';
import { WalletTransactionType } from './models/wallet-transaction.schema';
import { IWalletRepositoryToken } from './interfaces/wallet-repository.interface';
import { PaginatedWalletTransactionsResponseDto, PayFromWalletDto } from './dto/wallet.dto';
import { IQuotationService, IQuotationServiceToken } from 'src/quotation/interfaces/quotation.service.interface';
import { Types } from 'mongoose';
import { ITransactionService, ITransactionServiceToken } from 'src/common/transaction/interfaces/transaction.service.interface';
import { PaymentMethod, PaymentStatus, PaymentType } from 'src/common/transaction/models/transaction.schema';
import { TransactionResponseDto } from 'src/users/dto/users.dto';
import { Quotation } from 'src/quotation/models/quotation.schema';
import { IAdminWalletService, IAdminWalletServiceToken } from './interfaces/admin-wallet.service.interface';

@Injectable()
export class WalletService implements IWalletService {
  constructor(
    @Inject(IWalletRepositoryToken) private readonly _walletRepo: IWalletRepository,
    @Inject(IQuotationServiceToken) private readonly _quotationService: IQuotationService,
    @Inject(ITransactionServiceToken) private readonly _transactionService: ITransactionService,
    @Inject(forwardRef(()=>IAdminWalletServiceToken)) private readonly _adminWalletService: IAdminWalletService,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this._walletRepo.findWalletByUserId(userId);
    if (!wallet) {
        wallet = await this._walletRepo.createWallet(userId);
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
      this._walletRepo.findTransactions(query, page, limit),
      this._walletRepo.countTransactions(query),
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
    const updatedWallet = await this._walletRepo.updateWalletBalance(userId, amount);

    await this._walletRepo.createTransaction(
      userId,
      wallet._id.toString(),
      amount,
      WalletTransactionType.CREDIT,
      'Funds added to wallet'
    );

    return updatedWallet;
  }

  async creditEditorWallet(editorUserId: string, amount: number, quotationId: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }

    const quotation = await this._quotationService.findById(new Types.ObjectId(quotationId));
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }

    const penalty = quotation.penalty || 0;
    const finalAmountForEditor = amount - penalty;

    if (finalAmountForEditor > 0) {
      const editorWallet = await this.getWallet(editorUserId);
      await this._walletRepo.updateWalletBalance(editorUserId, finalAmountForEditor);
      await this._walletRepo.createTransaction(
        editorUserId,
        editorWallet._id.toString(),
        finalAmountForEditor,
        WalletTransactionType.CREDIT_FROM_WORK,
        `Payment from work #${quotationId}`
      );
    }

    if (penalty > 0) {
      const userWallet = await this.getWallet(quotation.userId.toString());
      await this._walletRepo.updateWalletBalance(quotation.userId.toString(), penalty);
      await this._walletRepo.createTransaction(
        quotation.userId.toString(),
        userWallet._id.toString(),
        penalty,
        WalletTransactionType.COMPENSATION,
        `Compensation for delayed work #${quotationId}`
      );
    }

    return true;
  }

  async withdrawMoney(userId: string, amount: number) {
    if (amount <= 0) {
        throw new BadRequestException('Amount must be positive.');
    }

    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient funds.');
    }

    const updatedWallet = await this._walletRepo.updateWalletBalance(userId, -amount);

    await this._walletRepo.createTransaction(
        userId,
        wallet._id.toString(),
        amount,
        WalletTransactionType.DEBIT,
        'Funds withdrawn from wallet'
    );

    return updatedWallet;
  }

  async refundUserForExpiredQuotation(userId: string, quotationId: string, amount: number): Promise<boolean> {
    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be positive.');
    }

    const wallet = await this.getWallet(userId);
    await this._walletRepo.updateWalletBalance(userId, amount);

    await this._walletRepo.createTransaction(
      userId,
      wallet._id.toString(),
      amount,
      WalletTransactionType.REFUND,
      `Refund for expired quotation #${quotationId}`,
    );

    return true;
  }

  async payFromWallet(userId: string, payFromWalletDto: PayFromWalletDto): Promise<TransactionResponseDto> {
    const { quotationId, amount, paymentType } = payFromWalletDto;

    const wallet = await this.getWallet(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient funds.');
    }

    const quotation = await this._quotationService.findById(new Types.ObjectId(quotationId));
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }

    if (quotation.isPaymentInProgress) {
      throw new BadRequestException('A payment for this quotation is already in progress.');
    }
    if (paymentType === PaymentType.ADVANCE && quotation.isAdvancePaid) {
      throw new BadRequestException('Advance payment has already been made for this quotation.');
    }
    if (paymentType === PaymentType.BALANCE && quotation.isFullyPaid) {
      throw new BadRequestException('This quotation has already been fully paid.');
    }

    await this._quotationService.updateQuotation({ _id: quotation._id }, { $set: { isPaymentInProgress: true } });

    await this._walletRepo.updateWalletBalance(userId, -amount);

    await this._walletRepo.createTransaction(
      userId,
      wallet._id.toString(),
      amount,
      WalletTransactionType.DEBIT,
      `Payment for quotation #${quotationId}`
    );

    const transaction = await this._transactionService.createTransaction({
      userId: new Types.ObjectId(userId),
      quotationId: new Types.ObjectId(quotationId),
      amount: amount,
      paymentType: paymentType,
      status: PaymentStatus.COMPLETED,
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.WALLET,
      currency: 'INR',
    });

    const update: any = { isPaymentInProgress: false };
    if (paymentType === PaymentType.ADVANCE) {
      update.isAdvancePaid = true;
    } else {
      update.isFullyPaid = true;
    }
    const updatedQuotation = await this._quotationService.updateQuotation(
      { _id: new Types.ObjectId(quotationId) },
      { $set: update }
    ) as Quotation;

    if (updatedQuotation.isFullyPaid) {
      await this._adminWalletService.recordUserPayment(updatedQuotation, transaction._id.toString());
    }

    return transaction;
  }
}