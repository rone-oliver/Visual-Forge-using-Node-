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