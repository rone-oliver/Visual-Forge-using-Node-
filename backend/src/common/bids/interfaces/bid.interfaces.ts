import { Types } from 'mongoose';
import { Bid } from 'src/common/bids/models/bids.schema';
import { CreateBidDto } from '../dto/create-bid.dto';
import { BidResponseDto } from '../dto/bid-response.dto';

export interface IBidRepository {
    findByFilters(filters: Partial<Bid>): Promise<Bid | null>;
    findById(id: string | Types.ObjectId, options?: any): Promise<Bid | null>;
    create(bidData: Partial<Bid>): Promise<Bid>;
    findAllByQuotation(quotationId: Types.ObjectId): Promise<any[]>;
    findAllByEditor(editorId: Types.ObjectId): Promise<Bid[]>;
    save(bid: Partial<Bid> & { _id: Types.ObjectId }, options?: any): Promise<Bid>;
    updateMany(filter: any, update: any, options?: any): Promise<any>;
    delete(bidId: Types.ObjectId): Promise<void>;
    getAcceptedBid(quotationId: Types.ObjectId, editorId: Types.ObjectId): Promise<Bid>;
}

export interface IBidService {
  create(bidData: CreateBidDto, editorId: Types.ObjectId): Promise<Bid>;
  findAllByQuotation(quotationId: Types.ObjectId): Promise<BidResponseDto[]>;
  findAllByEditor(editorId: Types.ObjectId): Promise<Bid[]>;
  acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId): Promise<Bid>;
  updateBid(bidId: Types.ObjectId, editorId: Types.ObjectId, bidAmount: number, notes?: string): Promise<Bid>;
  deleteBid(bidId: Types.ObjectId, editorId: Types.ObjectId): Promise<void>;
  getAcceptedBid(quotationId: Types.ObjectId, editorId: Types.ObjectId): Promise<Bid>;
}