import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { EditorBidDetailsDto } from 'src/editors/dto/editors.dto';
import {
  OutputType,
  QuotationStatus,
} from 'src/quotation/models/quotation.schema';
import { FileType as CommonFileType } from 'src/quotation/models/quotation.schema';
import { TimelineResponseDto } from 'src/timeline/dtos/timeline.dto';
import { UserBasicInfoDto } from 'src/users/dto/users.dto';

export class TopUserDto {
  @ApiProperty()
  @IsMongoId()
  _id: Types.ObjectId;

  @ApiProperty()
  @IsString()
  fullname: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNumber()
  quotationCount: number;
}

export class getQuotationsByStatusResponseDto {
  [key: string]: number;
}

export interface IQuotation {
  _id?: string | Types.ObjectId;
  userId?: string | Types.ObjectId;
  title: string;
  description: string;
  theme?: string;
  estimatedBudget?: number;
  advanceAmount?: number;
  dueDate?: Date | string;
  status?: QuotationStatus;
  outputType: OutputType;
  editor?: string;
  editorId?: string | Types.ObjectId;
  paymentPending?: boolean;
  attachedFiles?: FileAttachment[];
  imageUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  bidCount?: number;
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export interface FileAttachment {
  url: string;
  fileType: FileType;
  fileName: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: Date;
}

export class FileAttachmentDto {
  @ApiProperty({ description: 'URL of the uploaded file' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'Type of the file',
    enum: CommonFileType,
    enumName: 'CommonFileType',
  })
  @IsEnum(CommonFileType)
  @IsNotEmpty()
  fileType: CommonFileType;

  @ApiProperty({ description: 'Original name of the file' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiPropertyOptional({ description: 'Size of the file in bytes' })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: 'MIME type of the file' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Timestamp of when the file was uploaded',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  uploadedAt?: Date;
}

export class AcceptedQuotationsFileAttachmentDto extends FileAttachmentDto {
  uniqueId: string;
  timestamp: number;
}

export class AcceptedQuotationItemDto {
  @ApiProperty()
  @IsMongoId()
  _id: Types.ObjectId;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedBudget?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty({ enum: OutputType })
  @IsEnum(OutputType)
  outputType: OutputType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiProperty({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  status: QuotationStatus;

  @ApiProperty()
  @IsMongoId()
  userId: Types.ObjectId; // Client's ID

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userFullName?: string; // Client's full name

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [AcceptedQuotationsFileAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptedQuotationsFileAttachmentDto)
  attachedFiles?: AcceptedQuotationsFileAttachmentDto[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for filtering' })
  @IsOptional()
  @IsString()
  searchTerm?: string;
}

export class GetAcceptedQuotationsQueryDto extends PaginationQueryDto {}

export class PaginatedAcceptedQuotationsResponseDto {
  @ApiProperty({ type: [AcceptedQuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptedQuotationItemDto)
  quotations: AcceptedQuotationItemDto[];

  @ApiProperty()
  @IsNumber()
  totalItems: number;

  @ApiProperty()
  @IsNumber()
  currentPage: number;

  @ApiProperty()
  @IsNumber()
  itemsPerPage: number;
}

export class GetPublishedQuotationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by media type',
    enum: OutputType,
    enumName: 'OutputType',
  })
  @IsOptional()
  @IsEnum(OutputType)
  mediaType?: OutputType | string;
}

export class PublishedQuotationItemDto {
  @ApiProperty() @IsMongoId() _id: string;
  @ApiProperty() @IsMongoId() userId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  status: QuotationStatus;
  @ApiProperty({ enum: OutputType }) @IsEnum(OutputType) outputType: OutputType;
  @ApiPropertyOptional() @IsString() mediaType?: string;
  @ApiPropertyOptional() @IsNumber() budget?: number;
  @ApiPropertyOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional({ type: () => [String] })
  @IsArray()
  @IsOptional()
  files?: string[]; // Assuming file URLs or IDs
  @ApiPropertyOptional({ type: () => [String] })
  @IsArray()
  @IsOptional()
  sampleFiles?: string[];
  @ApiPropertyOptional({
    description: 'Details of the bid made by the current editor, if any',
  })
  @ValidateNested()
  @Type(() => EditorBidDetailsDto)
  @IsOptional()
  editorBid?: EditorBidDetailsDto;
  @ApiProperty() @IsDateString() createdAt: Date;
  @ApiProperty() @IsDateString() updatedAt: Date;
}

export class PaginatedPublishedQuotationsResponseDto {
  @ApiProperty({ type: () => [PublishedQuotationItemDto] })
  @ValidateNested({ each: true })
  @Type(() => PublishedQuotationItemDto)
  quotations: PublishedQuotationItemDto[];

  @ApiProperty({ description: 'Total number of items found' })
  @IsNumber()
  totalItems: number;

  @ApiProperty({ description: 'Current page number' })
  @IsNumber()
  currentPage: number;

  @ApiProperty({ description: 'Number of items per page' })
  @IsNumber()
  itemsPerPage: number;
}

export class TopQuotationByBidsDto {
  @ApiProperty()
  @IsMongoId()
  _id: Types.ObjectId;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  status: QuotationStatus;

  @ApiProperty()
  @IsNumber()
  bidCount: number;

  @ApiProperty({ type: () => UserBasicInfoDto })
  @ValidateNested()
  @Type(() => UserBasicInfoDto)
  user: UserBasicInfoDto;
}

// For CompletedWork response
export class CompletedWorkDto {
  @ApiProperty()
  @IsMongoId()
  quotationId: Types.ObjectId;

  @ApiProperty()
  @IsMongoId()
  worksId: Types.ObjectId;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty()
  @IsNumber()
  estimatedBudget: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  advanceAmount?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiProperty({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  status: QuotationStatus;

  @ApiProperty({ enum: OutputType })
  @IsEnum(OutputType)
  outputType: OutputType;

  @ApiPropertyOptional({ type: [FileAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  attachedFiles?: FileAttachmentDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty()
  @IsMongoId()
  userId: Types.ObjectId;

  @ApiProperty()
  @IsMongoId()
  editorId: Types.ObjectId;

  @ApiProperty({ type: [FileAttachmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  finalFiles: FileAttachmentDto[];

  @ApiProperty()
  @IsString()
  comments: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  completedAt?: Date;

  @ApiPropertyOptional({ type: [TimelineResponseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineResponseDto)
  timeline?: TimelineResponseDto[];
}
