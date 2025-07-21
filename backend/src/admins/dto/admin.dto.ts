import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import {
  Categories,
  EditorRequestStatus,
} from 'src/editors/models/editorRequest.schema';
import {
  TopQuotationByBidsDto,
  TopUserDto,
} from 'src/quotation/dtos/quotation.dto';
import { TopEditorDto } from 'src/works/dtos/works.dto';

export interface GetAllUsersQueryDto {
  isEditor?: boolean;
  gender?: string;
  behaviourRating?: number | string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface GetEditorsQueryDto {
  video?: string; // Expected 'true' or 'false'. Consider transforming to boolean in controller/DTO.
  image?: string; // Expected 'true' or 'false'.
  audio?: string; // Expected 'true' or 'false'.
  rating?: string; // Expected as string, parsed to float. Consider number type with validation.
  search?: string;
  page?: string;
  limit?: string;
}

export interface FormattedEditorRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullname: string;
  email: string;
  categories: Categories;
  createdAt: Date;
  status: EditorRequestStatus;
  reason?: string;
}

export interface FormattedEditor {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullname: string;
  username: string;
  email: string;
  profileImage?: string;
  category: string[];
  score: number;
  ratingsCount: number;
  averageRating: number;
  createdAt: Date;
  isVerified: boolean;
  isBlocked: boolean;
  socialLinks?: any;
}

export class FinancialSummaryDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalPayouts: number;

  @ApiProperty()
  netProfit: number;

  @ApiProperty()
  totalPlatformFee: number;
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
  financialSummary: FinancialSummaryDto;
  topUsersByQuotations: TopUserDto[];
  topEditorsByCompletedWorks: TopEditorDto[];
  topQuotationsByBids: TopQuotationByBidsDto[];
}
