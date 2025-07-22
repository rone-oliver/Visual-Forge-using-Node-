import { Types } from 'mongoose';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import {
  BidResponseDto,
  CreateEditorBidBodyDto,
  EditorBidDto,
  GetBiddedQuotationsQueryDto,
  PaginatedBiddedQuotationsResponseDto,
  UpdateEditorBidBodyDto,
} from '../../dto/editors.dto';

export const IEditorBidServiceToken = Symbol('IEditorBidService');

export interface IEditorBidService {
  createBid(
    editorId: Types.ObjectId,
    bidDto: CreateEditorBidBodyDto,
  ): Promise<BidResponseDto>;
  updateBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
    bidDto: UpdateEditorBidBodyDto,
  ): Promise<BidResponseDto>;
  cancelAcceptedBid(
    bidId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<SuccessResponseDto>;
  deleteBid(bidId: Types.ObjectId, editorId: Types.ObjectId): Promise<void>;
  getEditorBidForQuotation(
    quotationId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<EditorBidDto>;
  getBiddedQuotations(
    editorId: Types.ObjectId,
    query: GetBiddedQuotationsQueryDto,
  ): Promise<PaginatedBiddedQuotationsResponseDto>;
}
