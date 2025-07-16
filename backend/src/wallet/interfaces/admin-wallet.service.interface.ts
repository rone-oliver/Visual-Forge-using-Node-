import { Quotation } from "src/quotation/models/quotation.schema";
import { PaginatedLedgerResponseDto } from "../dto/wallet.dto";
import { FinancialSummaryDto } from "src/admins/dto/admin.dto";

export const IAdminWalletServiceToken = Symbol('IAdminWalletService');

export interface IAdminWalletService {
    recordUserPayment(quotation: Quotation, razorpayPaymentId: string): Promise<void>;
    getLedger(page?: number, limit?: number): Promise<PaginatedLedgerResponseDto>;
    creditWelcomeBonus(userId: string): Promise<void>;
    getTransactionCountByFlow(): Promise<{ credit: number; debit: number }>;
    getFinancialSummary(): Promise<FinancialSummaryDto>;
}