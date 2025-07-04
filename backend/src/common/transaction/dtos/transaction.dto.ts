import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { SortOrder } from 'mongoose';
import { PaymentStatus, PaymentType } from '../models/transaction.schema';

export interface IFindOptions {
    skip?: number;
    limit?: number;
    sort?: { [key: string]: SortOrder | { $meta: "textScore" } };
    populate?: string | string[] | any;
}

export class GetTransactionsQueryDto {
    @ApiPropertyOptional({
        description: 'Page number for pagination',
        default: 1,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        default: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({
        description: 'Filter by payment type',
        enum: PaymentType,
    })
    @IsOptional()
    @IsEnum(PaymentType)
    paymentType?: PaymentType;

    @ApiPropertyOptional({
        description: 'Filter by payment status',
        enum: PaymentStatus,
    })
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;
}