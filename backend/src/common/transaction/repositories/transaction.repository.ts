import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { IFindOptions } from '../dtos/transaction.dto';
import { ITransactionRepository } from '../interfaces/transaction.repository.interface';
import { Transaction, TransactionDocument } from '../models/transaction.schema';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  private readonly _logger = new Logger(TransactionRepository.name);

  constructor(
    @InjectModel(Transaction.name)
    private readonly _transactionModel: Model<TransactionDocument>,
  ) {}

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    return this._transactionModel.create(transactionData);
  }

  async find(conditions: any, options?: IFindOptions): Promise<Transaction[]> {
    const query = this._transactionModel.find(conditions);

    if (options?.sort) {
      query.sort(options.sort);
    }

    if (options?.skip) {
      query.skip(options.skip);
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.populate) {
      query.populate(options.populate);
    }

    return query.lean().exec();
  }

  async count(conditions: any): Promise<number> {
    return this._transactionModel.countDocuments(conditions).exec();
  }

  async findByQuotationId(quotationId: string): Promise<Transaction[]> {
    return this._transactionModel
      .find({ quotationId: new Types.ObjectId(quotationId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
