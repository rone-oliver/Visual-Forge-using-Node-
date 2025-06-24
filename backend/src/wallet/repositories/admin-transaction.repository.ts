import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminTransaction } from '../models/admin-transaction.schema';
import { IAdminTransactionRepository } from '../interfaces/admin-transaction.repository.interface';

@Injectable()
export class AdminTransactionRepository implements IAdminTransactionRepository {
  constructor(
    @InjectModel(AdminTransaction.name)
    private readonly adminTransactionModel: Model<AdminTransaction>,
  ) {}

  async create(transactionDto: Partial<AdminTransaction>): Promise<AdminTransaction> {
    return await this.adminTransactionModel.create(transactionDto);
  }

  async findAll(filter: {skip?: number, limit?: number} = {}): Promise<AdminTransaction[]> {
    const { skip = 0, limit = 10 } = filter;
    return this.adminTransactionModel
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullname email')
    .populate('editor', 'fullname email')
    .populate('quotation', 'title')
    .exec();
  }

  async count(): Promise<number> {
    return this.adminTransactionModel.countDocuments().exec();
  }
}