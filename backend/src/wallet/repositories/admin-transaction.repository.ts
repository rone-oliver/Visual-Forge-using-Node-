import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminTransaction, AdminTransactionType, TransactionFlow } from '../models/admin-transaction.schema';
import { IAdminTransactionRepository } from '../interfaces/admin-transaction.repository.interface';

@Injectable()
export class AdminTransactionRepository implements IAdminTransactionRepository {
  constructor(
    @InjectModel(AdminTransaction.name)
    private readonly _adminTransactionModel: Model<AdminTransaction>,
  ) {}

  async create(transactionDto: Partial<AdminTransaction>): Promise<AdminTransaction> {
    return await this._adminTransactionModel.create(transactionDto);
  }

  async findAll(filter: {skip?: number, limit?: number} = {}): Promise<AdminTransaction[]> {
    const { skip = 0, limit = 10 } = filter;
    return this._adminTransactionModel
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
    return this._adminTransactionModel.countDocuments().exec();
  }

  async getTransactionCountByFlow(): Promise<{ credit: number; debit: number }> {
    const result = await this._adminTransactionModel.aggregate([
      {
        $group: {
          _id: '$flow',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      credit: 0,
      debit: 0,
    };

    result.forEach((item) => {
      if (item._id === TransactionFlow.CREDIT) {
        counts.credit = item.count;
      } else if (item._id === TransactionFlow.DEBIT) {
        counts.debit = item.count;
      }
    });

    return counts;
  }

  async getFinancialSummary(): Promise<{ totalRevenue: number; totalPlatformFee: number; totalPayouts: number; }> {
    const result = await this._adminTransactionModel.aggregate([
      {
        $facet: {
          totalRevenue: [
            { $match: { flow: TransactionFlow.CREDIT } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ],
          totalPlatformFee: [
            { $match: { transactionType: AdminTransactionType.USER_PAYMENT } },
            { $group: { _id: null, total: { $sum: '$commission' } } }
          ],
          totalPayouts: [
            { $match: { flow: TransactionFlow.DEBIT } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]
        }
      }
    ]);

    const totalRevenue = result[0]?.totalRevenue[0]?.total || 0;
    const totalPlatformFee = result[0]?.totalPlatformFee[0]?.total || 0;
    const totalPayouts = result[0]?.totalPayouts[0]?.total || 0;

    return { totalRevenue, totalPlatformFee, totalPayouts };
  }
}