import { GetTransactionsDto, UpdateWalletDto } from "../dto/wallet.dto";

export interface IWalletController {
    getWallet(userId: string): Promise<any>;
    getTransactions(userId: string, query: GetTransactionsDto): Promise<any>;
    addMoney(userId: string, body: UpdateWalletDto): Promise<any>;
    withdrawMoney(userId: string, body: UpdateWalletDto): Promise<any>;
}