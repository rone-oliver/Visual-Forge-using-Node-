import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import { OutputType, QuotationStatus } from 'src/quotation/models/quotation.schema';
import { BidStatus } from 'src/common/bids/models/bids.schema';
import { FileAttachmentDto } from 'src/quotation/dtos/quotation.dto';

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

  @IsNumber()
  followersCount: number;

  @IsNumber()
  followingCount: number;

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

export interface Rating{
  rating: number;
  feedback?: string;
  userId: Types.ObjectId;
}