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
    name: string;
    email: string;
    profilePicture?: string;
  };
  quotation?: any; // This will be populated with IQuotation data when needed
}
