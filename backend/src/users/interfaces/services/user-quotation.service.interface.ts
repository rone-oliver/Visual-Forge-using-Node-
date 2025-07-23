import { Types } from 'mongoose';
import { Bid } from 'src/common/bids/models/bids.schema';
import { PaymentType } from 'src/common/transaction/models/transaction.schema';
import { BidResponseDto, SuccessResponseDto, TransactionResponseDto } from 'src/users/dto/users.dto';
import {
  CreateQuotationDto,
  GetQuotationsParamsDto,
  PaginatedQuotationsResponseDto,
  QuotationResponseDto,
  QuotationWithBidCountDto,
  UpdateQuotationDto,
} from '../../dto/users.dto';

export const IUserQuotationServiceToken = Symbol('IUserQuotationService');

export interface IUserQuotationService {
  getQuotations(
    userId: Types.ObjectId,
    params: GetQuotationsParamsDto,
  ): Promise<PaginatedQuotationsResponseDto>;

  createQuotation(
    userId: Types.ObjectId,
    createQuotationDto: CreateQuotationDto,
  ): Promise<QuotationResponseDto>;

  getQuotation(
    quotationId: Types.ObjectId,
  ): Promise<QuotationResponseDto | null>;

  updateQuotation(
    quotationId: Types.ObjectId,
    userId: Types.ObjectId,
    updateQuotationDto: UpdateQuotationDto,
  ): Promise<QuotationResponseDto>;

  deleteQuotation(quotationId: Types.ObjectId): Promise<SuccessResponseDto>;

  getBidsByQuotation(
    quotationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<BidResponseDto[]>;

  acceptBid(
    bidId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<BidResponseDto>;

  payForWork(
    userId: Types.ObjectId,
    quotationId: Types.ObjectId,
    paymentDetails: {
      paymentId: string;
      orderId: string;
      amount: number;
      paymentType: PaymentType;
    },
  ): Promise<TransactionResponseDto>;
}
