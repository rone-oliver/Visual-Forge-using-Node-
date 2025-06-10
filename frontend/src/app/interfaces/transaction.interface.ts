export interface Transaction {
  _id: string;
  quotationId: {
    title: string;
  };
  amount: number;
  paymentType: string;
  status: string;
  createdAt: string;
}

export interface PaginatedTransactionResponse {
  transactions: Transaction[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}