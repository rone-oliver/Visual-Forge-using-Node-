import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsMongoId,
  IsEnum,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaymentType } from 'src/common/transaction/models/transaction.schema';

import { AdminTransaction } from '../models/admin-transaction.schema';
import { WalletTransaction } from '../models/wallet-transaction.schema';
import { WalletTransactionType } from '../models/wallet-transaction.schema';

// For GET /wallet/transactions
export class GetTransactionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// For POST /wallet/add-money and /wallet/withdraw-money
export class UpdateWalletDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;
}

export class PayFromWalletDto {
  @IsMongoId()
  @IsNotEmpty()
  quotationId: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentType)
  @IsNotEmpty()
  paymentType: PaymentType;
}

export class PaginatedWalletTransactionsResponseDto {
  data: WalletTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

export class GetLedgerQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}

export class PaginatedLedgerResponseDto {
  transactions: AdminTransaction[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalBalance: number;
}
