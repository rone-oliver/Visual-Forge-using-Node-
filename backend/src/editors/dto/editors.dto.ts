import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { BidStatus } from 'src/common/bids/models/bids.schema';
import { FileAttachmentDto } from 'src/quotation/dtos/quotation.dto';
import {
  OutputType,
  QuotationStatus,
} from 'src/quotation/models/quotation.schema';

// Base DTO for pagination
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

export class FileUploadResultDto extends FileAttachmentDto {
  @ApiProperty({ description: 'Unique ID for the file in storage' })
  @IsString()
  uniqueId: string;

  @ApiProperty({ description: 'Timestamp of the upload' })
  @IsNumber()
  timestamp: number;

  @ApiProperty({ description: 'File format or extension' })
  @IsString()
  format: string;
}

export class SubmitWorkBodyDto {
  @ApiProperty({
    description: 'ID of the quotation for which work is being submitted',
  })
  @IsMongoId()
  @IsNotEmpty()
  quotationId: string; // Will be converted to Types.ObjectId in service

  @ApiProperty({
    type: [FileUploadResultDto],
    description: 'Array of final work files',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadResultDto)
  finalFiles: FileUploadResultDto[];

  @ApiPropertyOptional({
    description: 'Comments from the editor about the work',
  })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateEditorBidBodyDto {
  @ApiProperty({ description: 'ID of the quotation to bid on' })
  @IsMongoId()
  @IsNotEmpty()
  quotationId: string;

  @ApiProperty({ description: 'Amount of the bid' })
  @IsNumber()
  @Min(0.01) // Assuming bid amount must be positive
  bidAmount: number;

  @ApiPropertyOptional({ description: 'Notes for the bid' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEditorBidBodyDto {
  @ApiProperty({ description: 'New amount for the bid' })
  @IsNumber()
  @Min(0.01)
  bidAmount: number;

  @ApiPropertyOptional({ description: 'Updated notes for the bid' })
  @IsOptional()
  @IsString()
  notes?: string;
}

class EditorSocialLinksDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedIn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pinterest?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;
}

export class EditorDetailsDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Categories the editor specializes in',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({ description: "Editor's score" })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ description: "Editor's tips and tricks" })
  @IsOptional()
  @IsString()
  tipsAndTricks?: string;

  @ApiPropertyOptional({ description: "Editor's shared tutorials" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sharedTutorials?: string[];

  @ApiPropertyOptional({ description: 'Number of ratings received' })
  @IsOptional()
  @IsNumber()
  ratingsCount?: number;

  @ApiPropertyOptional({ description: 'Average rating of the editor' })
  @IsOptional()
  @IsNumber()
  averageRating?: number;

  @ApiPropertyOptional({
    type: EditorSocialLinksDto,
    description: 'Social media links of the editor',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EditorSocialLinksDto)
  socialLinks?: EditorSocialLinksDto;

  @IsNumber()
  followersCount: number;

  @IsNumber()
  followingCount: number;

  @ApiPropertyOptional({
    description: 'Date when the editor profile was created',
  })
  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

// DTO for the User part of the EditorDetailsResponseDto
export class UserForEditorDetailsDto {
  @ApiProperty({ description: 'User ID' })
  @IsMongoId()
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Full name of the user' })
  @IsString()
  fullname: string;

  @ApiProperty({ description: 'Username' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Email address' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ description: 'Indicates if the user is an editor' })
  @IsBoolean()
  isEditor: boolean;
}

export class EditorDetailsResponseDto extends UserForEditorDetailsDto {
  @ApiPropertyOptional({
    type: EditorDetailsDto,
    description: 'Detailed information about the editor',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EditorDetailsDto)
  editorDetails?: EditorDetailsDto;
}

// For getPublishedQuotations (reusing common.interface.ts for now, can be refined)
// We'll use IQuotationWithEditorBid and PaginatedEditorQuotationsResponse from common.interface.ts
// as they are already well-defined for this purpose.

// For Bid responses
export class BidResponseDto {
  @ApiProperty()
  @IsMongoId()
  _id: Types.ObjectId;

  @ApiProperty()
  @IsMongoId()
  quotationId: Types.ObjectId;

  @ApiProperty()
  @IsMongoId()
  editorId: Types.ObjectId;

  @ApiProperty()
  @IsNumber()
  bidAmount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: BidStatus })
  @IsEnum(BidStatus)
  status: BidStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}

// New DTOs for Published Quotations

export class EditorBidDetailsDto {
  @ApiPropertyOptional({
    description: 'ID of the bid made by the editor on this quotation',
  })
  @IsMongoId()
  @IsOptional()
  bidId?: string;

  @ApiPropertyOptional({ description: 'Amount of the bid' })
  @IsNumber()
  @IsOptional()
  bidAmount?: number;

  @ApiPropertyOptional({ enum: BidStatus, description: 'Status of the bid' })
  @IsEnum(BidStatus)
  @IsOptional()
  bidStatus?: BidStatus;

  @ApiPropertyOptional({ description: 'Notes provided with the bid' })
  @IsString()
  @IsOptional()
  bidNotes?: string;

  @ApiPropertyOptional({ description: 'Timestamp of when the bid was created' })
  @IsDateString()
  @IsOptional()
  bidCreatedAt?: Date;
}

export class AddTutorialDto {
  @ApiProperty({ description: 'URL of the tutorial to add' })
  @IsUrl()
  @IsNotEmpty()
  tutorialUrl: string;
}

export class RemoveTutorialDto {
  @ApiProperty({ description: 'URL of the tutorial to remove' })
  @IsUrl(
    { require_protocol: true },
    { message: 'A valid tutorial URL is required.' },
  )
  @IsNotEmpty({ message: 'Tutorial URL cannot be empty.' })
  tutorialUrl: string;
}

export interface Rating {
  rating: number;
  feedback?: string;
  userId: Types.ObjectId;
}

export class GetBiddedQuotationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BidStatus, description: 'Filter by bid status' })
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;

  @ApiPropertyOptional({
    description: 'Set to true to hide non-biddable quotations',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  hideNonBiddable?: boolean;
}

export class EditorBidDto {
  @ApiProperty({ description: 'The unique identifier of the bid' })
  _id: string;

  @ApiProperty({ description: 'The amount of the bid' })
  bidAmount: number;

  @ApiPropertyOptional({ description: 'Optional notes included with the bid' })
  bidNotes?: string;

  @ApiProperty({
    enum: BidStatus,
    description: 'The current status of the bid',
  })
  bidStatus: BidStatus;

  @ApiProperty({ description: 'The date the bid was created' })
  bidCreatedAt: Date;
}

export class BiddedQuotationDto {
  @ApiProperty({ type: String, description: 'Quotation ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Title of the quotation' })
  title: string;

  @ApiProperty({
    enum: QuotationStatus,
    description: 'Current status of the quotation',
  })
  quotationStatus: QuotationStatus;

  @ApiProperty({ description: 'Deadline for the quotation work' })
  deadline: Date;

  @ApiProperty({ description: 'The amount the editor bidded' })
  bidAmount: number;

  @ApiProperty({
    enum: BidStatus,
    description: "The status of the editor's bid",
  })
  bidStatus: BidStatus;

  @ApiProperty({ description: 'The date the bid was placed' })
  bidCreatedAt: Date;

  @ApiProperty({
    description:
      'Indicates if the work for this quotation was assigned to the current editor',
  })
  isWorkAssignedToMe: boolean;

  @ApiProperty({
    description: 'Indicates if the quotation is still open for bidding',
  })
  isQuotationBiddable: boolean;

  @ApiPropertyOptional({
    description: 'The final amount if the bid was accepted',
  })
  finalAmount?: number;

  @ApiPropertyOptional({ description: 'The ID of the editor who won the bid' })
  acceptedEditorId?: Types.ObjectId;
}

export class PaginatedBiddedQuotationsResponseDto {
  @ApiProperty({ type: [BiddedQuotationDto] })
  data: BiddedQuotationDto[];

  @ApiProperty({ description: 'Total number of bidded quotations' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Indicates if there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Indicates if there is a previous page' })
  hasPrevPage: boolean;
}
