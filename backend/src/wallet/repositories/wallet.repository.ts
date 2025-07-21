import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { IWalletRepository } from '../interfaces/wallet-repository.interface';
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTransactionType,
} from '../models/wallet-transaction.schema';
import { Wallet, WalletDocument } from '../models/wallet.schema';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(
    @InjectModel(Wallet.name)
    private readonly _walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private readonly _walletTransactionModel: Model<WalletTransactionDocument>,
  ) {}

  async findWalletByUserId(userId: string): Promise<Wallet | null> {
    return this._walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .exec();
  }

  async createWallet(userId: string): Promise<Wallet> {
    return this._walletModel.create({ user: new Types.ObjectId(userId) });
  }

  async updateWalletBalance(userId: string, amount: number): Promise<Wallet> {
    const updatedWallet = await this._walletModel
      .findOneAndUpdate(
        { user: new Types.ObjectId(userId) },
        { $inc: { balance: amount } },
        { new: true },
      )
      .exec();

    if (!updatedWallet) {
      throw new Error('Wallet not found for balance update.');
    }
    return updatedWallet;
  }

  async findTransactions(
    query: any,
    page: number,
    limit: number,
  ): Promise<WalletTransaction[]> {
    return this._walletTransactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async createTransaction(
    userId: string,
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
  ): Promise<WalletTransaction> {
    const transaction = await this._walletTransactionModel.create({
      user: new Types.ObjectId(userId),
      wallet: new Types.ObjectId(walletId),
      amount,
      type,
      description,
    });
    return transaction;
  }

  async countTransactions(query: any): Promise<number> {
    return this._walletTransactionModel.countDocuments(query);
  }
}
