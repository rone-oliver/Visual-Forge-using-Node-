export enum AdminTransactionType {
    USER_PAYMENT = 'user_payment',
    EDITOR_PAYOUT = 'editor_payout',
    WITHDRAWAL_FEE = 'withdrawal_fee',
    REFUND = 'refund',
}

export enum TransactionFlow {
    CREDIT = 'credit',
    DEBIT = 'debit',
}

export interface AdminTransaction {
    _id: string;
    flow: TransactionFlow;
    amount: number;
    transactionType: AdminTransactionType;
    user?: { _id: string; name: string; };
    editor?: { _id: string; name: string; };
    quotation?: { _id: string; title: string; };
    commission: number;
    razorpayPaymentId?: string;
    razorpayTransferId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedLedgerResponse {
    transactions: AdminTransaction[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
    totalBalance: number;
}