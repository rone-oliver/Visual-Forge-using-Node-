export enum BidStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired'
}

export interface IBid {
  _id: string;
  quotationId: string;
  editorId: string;
  bidAmount: number;
  status: BidStatus;
  dueDate: Date | string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
  // Populated fields
  editor?: {
    _id: string;
    fullname: string;
    email: string;
    profileImage?: string;
  };
  quotation?: any; // This will be populated with IQuotation data when needed
}

export interface IEditorBidDetails {
  bidId?: string;
  bidAmount?: number;
  bidStatus?: BidStatus;
  bidNotes?: string;
  bidCreatedAt?: Date | string;
}

export interface GetBiddedQuotationsQuery {
  page: number;
  limit: number;
  status?: BidStatus;
  hideNonBiddable?: boolean;
}

import { QuotationStatus } from './quotation.interface';

export interface BiddedQuotation {
  _id: string;
  title: string;
  quotationStatus: QuotationStatus;
  deadline: Date | string;
  bidAmount: number;
  bidStatus: BidStatus;
  bidCreatedAt: Date | string;
  isWorkAssignedToMe: boolean;
  isQuotationBiddable: boolean;
  finalAmount?: number;
  acceptedEditorId?: string;
}

export interface PaginatedBiddedQuotationsResponse {
  data: BiddedQuotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface EditorBid {
  _id: string;
  bidAmount: number;
  bidNotes?: string;
  bidStatus: string; 
  bidCreatedAt: string; 
}