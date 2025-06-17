export interface IWallet {
    _id: string;
    user: string;
    balance: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export interface IWalletTransaction {
    _id: string;
    wallet: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    createdAt: string;
    updatedAt:string;
}

export interface IPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}