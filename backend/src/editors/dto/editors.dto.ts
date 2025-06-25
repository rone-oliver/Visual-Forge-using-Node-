import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import { OutputType, QuotationStatus } from 'src/common/models/quotation.schema';
import { FileType as CommonFileType } from 'src/common/models/quotation.schema'; // Renaming to avoid conflict
import { BidStatus } from 'src/common/bids/models/bids.schema';

// Base DTO for pagination
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for filtering' })
  @IsOptional()
  @IsString()
  searchTerm?: string;
}

export class GetPublishedQuotationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by media type', enum: OutputType, enumName: 'OutputType' })
  @IsOptional()
  @IsEnum(OutputType)
  mediaType?: OutputType | string;
}

export class GetAcceptedQuotationsQueryDto extends PaginationQueryDto {}

export class FileAttachmentDto {
  @ApiProperty({ description: 'URL of the uploaded file' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Type of the file', enum: CommonFileType, enumName: 'CommonFileType' })
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

  @ApiPropertyOptional({ description: 'Timestamp of when the file was uploaded' })
  @IsOptional()
  @IsDateString()
  uploadedAt?: Date;
}

export class FileUploadResultDto extends FileAttachmentDto {}

export class SubmitWorkBodyDto {
  @ApiProperty({ description: 'ID of the quotation for which work is being submitted' })
  @IsMongoId()
  @IsNotEmpty()
  quotationId: string; // Will be converted to Types.ObjectId in service

  @ApiProperty({ type: [FileUploadResultDto], description: 'Array of final work files' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadResultDto)
  finalFiles: FileUploadResultDto[];

  @ApiPropertyOptional({ description: 'Comments from the editor about the work' })
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
  @ApiPropertyOptional({ type: [String], description: 'Categories the editor specializes in' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({ description: 'Editor\'s score' })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ description: 'Editor\'s tips and tricks' })
  @IsOptional()
  @IsString()
  tipsAndTricks?: string;

  @ApiPropertyOptional({ description: 'Editor\'s shared tutorials' })
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

  @ApiPropertyOptional({ type: EditorSocialLinksDto, description: 'Social media links of the editor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EditorSocialLinksDto)
  socialLinks?: EditorSocialLinksDto;

  @ApiPropertyOptional({ description: 'Date when the editor profile was created' })
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
  @ApiPropertyOptional({ type: EditorDetailsDto, description: 'Detailed information about the editor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EditorDetailsDto)
  editorDetails?: EditorDetailsDto;
}

// For getAcceptedQuotations response
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

  @ApiPropertyOptional({ type: [FileAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  attachedFiles?: FileAttachmentDto[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}

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
}

// New DTOs for Published Quotations

export class EditorBidDetailsDto {
  @ApiPropertyOptional({ description: 'ID of the bid made by the editor on this quotation' })
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

export class PublishedQuotationItemDto {
  @ApiProperty() @IsMongoId() _id: string;
  @ApiProperty() @IsMongoId() userId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ enum: QuotationStatus }) @IsEnum(QuotationStatus) status: QuotationStatus;
  @ApiProperty({ enum: OutputType }) @IsEnum(OutputType) outputType: OutputType;
  @ApiPropertyOptional() @IsString() mediaType?: string;
  @ApiPropertyOptional() @IsNumber() budget?: number;
  @ApiPropertyOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional({ type: () => [String] }) @IsArray() @IsOptional() files?: string[]; // Assuming file URLs or IDs
  @ApiPropertyOptional({ type: () => [String] }) @IsArray() @IsOptional() sampleFiles?: string[];
  @ApiPropertyOptional({ description: 'Details of the bid made by the current editor, if any' })
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

export class AddTutorialDto {
  @ApiProperty({
      description: 'The URL of the YouTube tutorial video.',
      example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsString()
  @IsUrl({}, { message: 'Please enter a valid URL.' })
  tutorialUrl: string;
}

export class RemoveTutorialDto {
  @IsUrl(
    { require_protocol: true },
    { message: 'A valid tutorial URL is required.' },
  )
  @IsNotEmpty({ message: 'Tutorial URL cannot be empty.' })
  tutorialUrl: string;
}