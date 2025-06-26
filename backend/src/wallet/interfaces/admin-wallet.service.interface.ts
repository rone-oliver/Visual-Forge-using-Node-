import { Quotation } from "src/common/models/quotation.schema";
import { AdminTransaction } from "../models/admin-transaction.schema";
import { User } from "src/users/models/user.schema";
import { PaginatedLedgerResponseDto } from "../dto/wallet.dto";

export const IAdminWalletServiceToken = Symbol('IAdminWalletService');

export interface IAdminWalletService {
    recordUserPayment(quotation: Quotation, razorpayPaymentId: string): Promise<void>;
    getLedger(page?: number, limit?: number): Promise<PaginatedLedgerResponseDto>;
    creditWelcomeBonus(userId: string): Promise<void>;
}