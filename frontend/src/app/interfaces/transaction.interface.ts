export interface Transaction {
  _id: string;
  quotationId: {
    title: string;
  };
  amount: number;
  paymentType: string;
  status: string;
  createdAt: string;
  paymentDate: string;
  paymentId: string;
  orderId: string;
  razorpayPaymentMethod: string;
  currency: string;
  bank?: string;
  wallet?: string;
  fee: number;
  tax: number;
}

export interface PaginatedTransactionResponse {
  transactions: Transaction[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}