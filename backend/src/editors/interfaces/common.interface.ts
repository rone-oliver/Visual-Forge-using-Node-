// In a suitable interface file
import { IQuotation } from "src/users/interface/Quotation.interface";
import { BidStatus } from 'src/common/bids/models/bids.schema';
import { OutputType } from 'src/common/models/quotation.schema';

export interface IEditorBidDetails {
  bidId?: string;
  bidAmount?: number;
  bidStatus?: BidStatus;
  bidNotes?: string;
  bidCreatedAt?: Date;
}

export interface IQuotationWithEditorBid extends IQuotation {
  editorBid?: IEditorBidDetails | null;
  userFullName?: string;
}

export interface PaginatedEditorQuotationsResponse {
  quotations: IQuotationWithEditorBid[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface GetEditorQuotationsParams {
  page: number;
  limit: number;
  mediaType?: OutputType | string;
  searchTerm?: string;
}