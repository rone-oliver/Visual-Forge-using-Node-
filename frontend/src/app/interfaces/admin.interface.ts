import { QuotationStatus } from "./quotation.interface";
import { User } from "./user.interface";

export interface FinancialSummary {
    totalRevenue: number;
    totalPayouts: number;
    netProfit: number;
    totalPlatformFee: number;
}

export interface TopUser {
    _id: string;
    fullname: string;
    email: string;
    quotationCount: number;
}

export interface TopEditor {
    _id: string;
    fullname: string;
    email: string;
    completedWorksCount: number;
}

export interface TopQuotationByBids {
    _id: string;
    title: string;
    status: QuotationStatus;
    bidCount: number;
    user: User;
}


export interface DashboardResponseDto {
    totalUsers: number;
    totalEditors: number;
    totalReports: number;
    totalQuotations: number;
    totalEditorRequests: number;
    quotationsByStatus: {
        Published: number;
        Accepted: number;
        Completed: number;
        Expired: number;
        Cancelled: number;
    };
    transactionCounts: {
        credit: number;
        debit: number;
    };
    financialSummary: FinancialSummary;
    topUsersByQuotations: TopUser[];
    topEditorsByCompletedWorks: TopEditor[];
    topQuotationsByBids: TopQuotationByBids[];
}
