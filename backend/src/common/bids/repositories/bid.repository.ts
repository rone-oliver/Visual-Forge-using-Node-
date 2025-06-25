// bid.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bid, BidDocument, BidStatus } from '../models/bids.schema';
import { IBidRepository } from '../interfaces/bid.interfaces';
import { BidResponseDto } from '../dto/bid-response.dto';
import { CreateBidDto } from '../dto/create-bid.dto';

interface PopulatedEditor {
  _id: Types.ObjectId;
  fullname: string;
  email: string;
  profileImage?: string;
}

@Injectable()
export class BidRepository implements IBidRepository {
  constructor(
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
  ) {}

  async findByFilters(filters: Partial<Bid>): Promise<Bid | null> {
    return this.bidModel.findOne(filters).exec();
  }

  async findById(id: string | Types.ObjectId, options?: any): Promise<Bid | null> {
    return this.bidModel.findById(id, null, options).exec();
  }

  async create(bidData: Partial<Bid>): Promise<Bid> {
    return this.bidModel.create(bidData);
  }

  async findAllByQuotation(quotationId: Types.ObjectId): Promise<any[]> {
    return this.bidModel
      .find({ quotationId })
      .populate<{ editorId: PopulatedEditor }>('editorId', 'fullname email profileImage')
      .sort({ bidAmount: 1 })
      .lean()
      .exec();
  }

  async findAllByEditor(editorId: Types.ObjectId): Promise<Bid[]> {
    return this.bidModel
      .find({ editorId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async save(bid: Partial<Bid> & { _id: Types.ObjectId }, options?: any): Promise<Bid> {
    return this.bidModel.findByIdAndUpdate(
        bid._id,
        bid,
        { new: true, ...options }
    ).lean().exec();
  }

  async getAcceptedBid(quotationId: Types.ObjectId, editorId: Types.ObjectId): Promise<Bid> {
    const bid = await this.bidModel.findOne({ quotationId, editorId, status: BidStatus.ACCEPTED }).lean().exec();
    if (!bid) {
      throw new NotFoundException('Bid not found');
    }
    return bid;
  }

  async updateMany(filter: any, update: any, options?: any): Promise<any> {
    return this.bidModel.updateMany(filter, update, options);
  }

  async delete(bidId: Types.ObjectId): Promise<void> {
    await this.bidModel.findByIdAndDelete(bidId);
  }
}