import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
    ValidateNested,
    Min,
    Max,
    IsUrl,
    IsObject,
    IsIn,
} from 'class-validator';
import { Types } from 'mongoose';
import { Gender, Language } from '../models/user.schema';
import { QuotationStatus, OutputType, FileType } from '../../quotation/models/quotation.schema';
import { BidStatus } from '../../common/bids/models/bids.schema';
import { PaymentType, PaymentStatus, PaymentMethod } from '../../common/models/transaction.schema';
import { EditorDetailsDto } from 'src/editors/dto/editors.dto'; // Assuming this exists and is relevant
import { ReportContext } from 'src/common/models/report.schema';

// --- Enums (Re-exported for DTO usage if not directly imported in service/controller) ---
export { Gender, Language, QuotationStatus, OutputType, FileType, BidStatus, PaymentType, PaymentStatus, PaymentMethod };

// --- Base/Helper DTOs ---
export class FileAttachmentDto {
    @ApiProperty({ description: 'URL of the attached file', example: 'https://example.com/file.jpg' })
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ enum: FileType, description: 'Type of the file' })
    @IsEnum(FileType)
    @IsNotEmpty()
    fileType: FileType;

    @ApiProperty({ description: 'Original name of the file', example: 'report.pdf' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiPropertyOptional({ description: 'Size of the file in bytes', example: 102400 })
    @IsNumber()
    @IsOptional()
    size?: number;

    @ApiPropertyOptional({ description: 'MIME type of the file', example: 'application/pdf' })
    @IsString()
    @IsOptional()
    mimeType?: string;

    @ApiPropertyOptional({ description: 'Upload timestamp' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    uploadedAt?: Date;
}

export class quotationFileAttachmentDto extends FileAttachmentDto {
    uniqueId: string;
    timestamp: number;
    format: string;
}

export class FileUploadResultDto {
    @ApiProperty()
    @IsString()
    url: string;

    @ApiProperty()
    @IsString()
    public_id: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    version?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    signature?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    width?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    height?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    format?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    resource_type?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    created_at?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    bytes?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    etag?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    placeholder?: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    secure_url?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    original_filename?: string;
}

export class UserBaseResponseDto {
    @ApiProperty({ type: String, description: 'User ID' })
    @IsMongoId()
    _id: Types.ObjectId; // Represent ObjectId as string

    @ApiProperty({ example: 'john_doe' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    fullname: string;

    @ApiPropertyOptional({ example: 'http://example.com/profile.jpg' })
    @IsString()
    @IsOptional()
    profileImage?: string;

    @ApiProperty()
    @IsBoolean()
    isVerified: boolean;

    @ApiProperty()
    @IsBoolean()
    isEditor: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isOnline?: boolean;
}

// --- User Profile & Management DTOs ---
export class UserProfileResponseDto extends UserBaseResponseDto {
    @ApiPropertyOptional({ example: 'A passionate developer.' })
    @IsString()
    @IsOptional()
    about?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    mobileNumber?: string;

    @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @ApiPropertyOptional({ enum: Language, example: Language.ENGLISH })
    @IsEnum(Language)
    @IsOptional()
    language?: Language;

    @ApiPropertyOptional({ example: 30 })
    @IsInt()
    @Min(1)
    @Max(120)
    @IsOptional()
    age?: number;

    @ApiPropertyOptional({ example: 4.5 })
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    behaviourRating?: number;

    // If editor details are part of user profile
    @ApiPropertyOptional({ type: () => EditorDetailsDto }) // Use existing DTO if suitable
    @ValidateNested()
    @Type(() => EditorDetailsDto)
    @IsOptional()
    editorDetails?: EditorDetailsDto; 
}

export class EditorRequestStatusResponseDto {
    @ApiPropertyOptional({ description: 'Status of the editor request', example: 'Pending' })
    @IsString()
    @IsOptional()
    status?: string | null;
}

export class UpdateProfileImageDto {
    @ApiProperty({ description: 'URL of the new profile image' })
    @IsString()
    @IsNotEmpty()
    profileImageUrl: string;
}

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'Johnathan Doe' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @IsOptional()
    fullname?: string;

    @ApiPropertyOptional({ example: 'A full-stack developer with a passion for AI.' })
    @IsString()
    @MaxLength(500)
    @IsOptional()
    about?: string;

    @ApiPropertyOptional({ example: '+1987654321' })
    @IsString()
    @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid mobile number format' })
    @IsOptional()
    mobileNumber?: string;

    @ApiPropertyOptional({ enum: Gender, example: Gender.OTHER })
    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @ApiPropertyOptional({ enum: Language, example: Language.SPANISH })
    @IsEnum(Language)
    @IsOptional()
    language?: Language;

    @ApiPropertyOptional({ example: 25 })
    @IsInt()
    @Min(1)
    @Max(120)
    @IsOptional()
    age?: number;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'Current password of the user', example: 'oldPassword123' })
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty({ description: 'New password for the user', example: 'newSecurePassword456' })
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    newPassword: string;
}

export class UserBasicInfoDto {
    @ApiProperty({ type: String, description: 'User ID' })
    @IsMongoId()
    _id: Types.ObjectId;

    @ApiProperty({ example: 'jane_doe' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'Jane Doe' })
    @IsString()
    fullname: string;

    @ApiProperty({ example: 'jane_doe@example.com' })
    @IsString()
    email: string;

    @ApiPropertyOptional({ example: 'http://example.com/jane.jpg' })
    @IsString()
    @IsOptional()
    profileImage?: string;
}

// --- Quotation DTOs ---
export class CreateQuotationDto {
    @ApiProperty({ description: 'Title of the quotation', example: 'Logo Design for Startup' })
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(100)
    title: string;

    @ApiProperty({ description: 'Detailed description of the quotation requirements', example: 'Need a modern and minimalist logo...' })
    @IsString()
    @IsNotEmpty()
    @MinLength(20)
    @MaxLength(2000)
    description: string;

    @ApiPropertyOptional({ description: 'Theme or style preference', example: 'Minimalist' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    theme?: string;

    @ApiPropertyOptional({ description: 'Estimated budget for the project', example: 500 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    estimatedBudget?: number;

    @ApiProperty({ enum: OutputType, description: 'Expected output type', example: OutputType.IMAGE })
    @IsEnum(OutputType)
    @IsNotEmpty()
    outputType: OutputType;

    @ApiPropertyOptional({ description: 'Due date for the quotation' })
    @IsDateString()
    @IsOptional()
    dueDate?: string; // Use string for input, transform to Date in service

    @ApiPropertyOptional({ type: [quotationFileAttachmentDto], description: 'Files attached to the quotation' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => quotationFileAttachmentDto)
    @IsOptional()
    attachedFiles?: Omit<quotationFileAttachmentDto,'url'>[];
}

export class UpdateQuotationDto {
    @ApiPropertyOptional({ description: 'Title of the quotation', example: 'Updated Logo Design' })
    @IsString()
    @IsOptional()
    @MinLength(5)
    @MaxLength(100)
    title?: string;

    @ApiPropertyOptional({ description: 'Detailed description', example: 'Updated requirements...' })
    @IsString()
    @IsOptional()
    @MinLength(20)
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({ description: 'Theme or style preference', example: 'Modern' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    theme?: string;

    @ApiPropertyOptional({ description: 'Estimated budget', example: 600 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    estimatedBudget?: number;

    @ApiPropertyOptional({ enum: OutputType, description: 'Expected output type' })
    @IsEnum(OutputType)
    @IsOptional()
    outputType?: OutputType;

    @ApiPropertyOptional({ description: 'Due date for the quotation' })
    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @ApiPropertyOptional({ type: [FileAttachmentDto], description: 'Files attached to the quotation' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FileAttachmentDto)
    @IsOptional()
    attachedFiles?: FileAttachmentDto[];
}

export class QuotationResponseDto extends CreateQuotationDto {
    @ApiProperty({ type: Types.ObjectId, description: 'Quotation ID' })
    @IsMongoId()
    _id: Types.ObjectId;

    @ApiProperty({ type: Types.ObjectId, description: 'User ID who created the quotation' })
    @IsMongoId()
    userId: Types.ObjectId;

    @ApiPropertyOptional({ description: 'Advance amount calculated for the quotation' })
    @IsNumber()
    @IsOptional()
    advanceAmount?: number;

    @ApiPropertyOptional({ description: 'Balance amount calculated for the quotation' })
    @IsNumber()
    @IsOptional()
    balanceAmount?: number;

    @ApiProperty({ description: 'Indicates if the advance payment has been made' })
    @IsBoolean()
    isAdvancePaid: boolean;

    @ApiProperty({ description: 'Indicates if the quotation is fully paid' })
    @IsBoolean()
    isFullyPaid: boolean;

    @ApiProperty({ enum: QuotationStatus, description: 'Current status of the quotation' })
    @IsEnum(QuotationStatus)
    status: QuotationStatus;

    @ApiPropertyOptional({ type: Types.ObjectId, description: 'Editor ID assigned to the quotation' })
    @IsMongoId()
    @IsOptional()
    editorId?: Types.ObjectId;

    @ApiPropertyOptional({ type: String, description: 'Editor name who has got the quotation'})
    @IsOptional()
    editor?: string;

    @ApiPropertyOptional({ type: Types.ObjectId, description: 'Works ID associated with the quotation' })
    @IsMongoId()
    @IsOptional()
    worksId?: Types.ObjectId;

    @ApiProperty({ description: 'Creation timestamp' })
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}

export class GetQuotationsParamsDto {
    @ApiPropertyOptional({ description: 'Page number for pagination', type: Number, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        type: Number,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({
        description: 'Filter by quotation status',
        enum: QuotationStatus,
        example: QuotationStatus.ACCEPTED,
    })
    @IsOptional()
    @IsString() // Validated more specifically in service if needed
    status?: QuotationStatus | 'All';

    @ApiPropertyOptional({ description: 'Search term for filtering quotations' })
    @IsOptional()
    @IsString()
    searchTerm?: string;
}

export class QuotationWithBidCountDto extends QuotationResponseDto {
    @ApiPropertyOptional({ description: 'Number of bids received for this quotation' })
    @IsInt()
    @IsOptional()
    bidCount?: number;
}

export class PaginatedQuotationsResponseDto {
    @ApiProperty({ type: [QuotationWithBidCountDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuotationWithBidCountDto)
    quotations: QuotationWithBidCountDto[];

    @ApiProperty({ description: 'Total number of items matching the query' })
    @IsInt()
    totalItems: number;

    @ApiProperty({ description: 'Total number of pages' })
    @IsInt()
    totalPages: number;

    @ApiProperty({ description: 'Current page number' })
    @IsInt()
    currentPage: number;

    @ApiProperty({ description: 'Number of items per page' })
    @IsInt()
    itemsPerPage: number;
}

// --- Bid DTOs ---
export class BidResponseDto {
    @ApiProperty({ type: Types.ObjectId, description: 'Bid ID' })
    @IsMongoId()
    _id: Types.ObjectId;

    @ApiProperty({ type: Types.ObjectId, description: 'Quotation ID for the bid' })
    @IsMongoId()
    quotationId: Types.ObjectId;

    @ApiProperty({ type: Types.ObjectId, description: 'Editor ID who placed the bid' })
    @IsMongoId()
    editorId: Types.ObjectId;

    @ApiProperty({ description: 'Bid amount offered by the editor' })
    @IsNumber()
    bidAmount: number;

    @ApiProperty({ enum: BidStatus, description: 'Current status of the bid' })
    @IsEnum(BidStatus)
    status: BidStatus;

    @ApiProperty({ description: 'Proposed due date by the editor' })
    @IsDate()
    @Type(() => Date)
    dueDate: Date;

    @ApiPropertyOptional({ description: 'Additional notes from the editor' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ description: 'Creation timestamp' })
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}

export class AcceptBidParamsDto {
    @ApiProperty({ type: String, description: 'Bid ID to accept' })
    @IsMongoId()
    bidId: string;
}

// --- Works DTOs ---
export class CompletedWorkDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    quotationId: string;

    @ApiProperty({ type: String })
    @IsMongoId()
    worksId: string;

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

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    estimatedBudget?: number;

    @ApiProperty({ enum: OutputType })
    @IsEnum(OutputType)
    outputType: OutputType;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @ApiPropertyOptional({ type: [FileAttachmentDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FileAttachmentDto)
    @IsOptional()
    quotationAttachedFiles?: FileAttachmentDto[];

    @ApiProperty({ enum: QuotationStatus })
    @IsEnum(QuotationStatus)
    quotationStatus: QuotationStatus;

    @ApiProperty({ type: String })
    @IsMongoId()
    editorId: string; // User ID of the editor

    @ApiProperty({ type: String })
    @IsMongoId()
    userId: string; // User ID of the client

    @ApiProperty({ type: [FileUploadResultDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FileUploadResultDto)
    finalFiles: FileUploadResultDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comments?: string;

    @ApiProperty()
    @IsBoolean()
    isPublic: boolean;

    @ApiPropertyOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    feedback?: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    quotationCreatedAt: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    workCreatedAt: Date;

    @ApiPropertyOptional({ type: () => UserProfileResponseDto })
    @ValidateNested()
    @Type(() => UserProfileResponseDto)
    @IsOptional()
    editorDetails?: UserProfileResponseDto;

    @ApiPropertyOptional({ type: () => UserProfileResponseDto })
    @ValidateNested()
    @Type(() => UserProfileResponseDto)
    @IsOptional()
    clientDetails?: UserProfileResponseDto;
}

export class RateWorkDto {
    @ApiProperty({ description: 'Rating for the work (1-5)', example: 5 })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ description: 'Feedback for the work', example: 'Excellent work!' })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    feedback?: string;
}

export class UpdateWorkPublicStatusDto {
    @ApiProperty({ description: 'Set the work as public or private' })
    @IsBoolean()
    isPublic: boolean;
}

export class GetPublicWorksQueryDto {
    @ApiProperty({ description: 'Page number for pagination', default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number;

    @ApiProperty({ description: 'Number of items per page', default: 10 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number;

    @ApiPropertyOptional({ description: 'Search term for filtering public works' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by rating (1-5)' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;
}

export class PublicWorkItemDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    _id: string;

    @ApiProperty({ type: () => UserBasicInfoDto, description: 'Editor who created the work' })
    @ValidateNested()
    @Type(() => UserBasicInfoDto)
    editor: UserBasicInfoDto;

    @ApiProperty({ type: () => UserBasicInfoDto, description: 'Client for whom the work was done' })
    @ValidateNested()
    @Type(() => UserBasicInfoDto)
    user: UserBasicInfoDto;

    @ApiProperty({ type: [FileUploadResultDto], description: 'Final files delivered for the work' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FileUploadResultDto)
    finalFiles: FileUploadResultDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comments?: string;

    @ApiProperty()
    @IsBoolean()
    isPublic: boolean;

    @ApiPropertyOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    feedback?: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}

export class UserEditorRatingDto {
    @ApiProperty()
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    feedback?: string;
}

export class PaginatedPublicWorksResponseDto {
    @ApiProperty({ type: [PublicWorkItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PublicWorkItemDto)
    works: PublicWorkItemDto[];

    @ApiProperty({ description: 'Total number of public works' })
    @IsInt()
    total: number;
}

// --- Rating DTOs (Editor) ---
export class RateEditorDto {
    @ApiProperty({ description: 'ID of the editor to rate' })
    @IsMongoId()
    editorId: string;

    @ApiProperty({ description: 'Rating for the editor (1-5)', example: 4 })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ description: 'Feedback for the editor', example: 'Very professional.' })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    feedback?: string;
}

export class EditorRatingResponseDto {
    @ApiProperty({ description: 'Average rating of the editor' })
    @IsNumber()
    averageRating: number;

    @ApiProperty({ description: 'Total number of ratings received by the editor' })
    @IsInt()
    totalRatings: number;

    @ApiPropertyOptional({ description: 'Rating given by the current user, if any' })
    @IsOptional()
    @ValidateNested()
    @Type(() => UserEditorRatingDto)
    currentUserRating?: UserEditorRatingDto;
}

export class UserRatingForEditorDto {
    @ApiProperty({ description: 'The rating score given by the user', example: 5 })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;
  
    @ApiPropertyOptional({ description: 'Feedback provided by the user' })
    @IsString()
    @IsOptional()
    feedback?: string;
  
    @ApiProperty({ type: String, description: 'ID of the user who gave the rating' })
    @IsMongoId()
    userId: string;
}

export class GetCurrentEditorRatingQueryDto {
    @ApiProperty({ description: 'ID of the editor whose rating is to be fetched' })
    @IsMongoId()
    editorId: string;
}

// --- Payment DTOs ---
export class CreatePaymentDto {
    @ApiProperty({ description: 'Amount for the payment', example: 1000 })
    @IsNumber()
    @Min(1) // Assuming minimum payment amount
    amount: number;

    @ApiPropertyOptional({ description: 'Currency for the payment (e.g., INR, USD)', example: 'INR' })
    @IsString()
    @IsOptional()
    currency?: string;
}

export class CreatePaymentResponseDto {
    @ApiProperty()
    id: string; // order_id
    @ApiProperty()
    entity: string;
    @ApiProperty()
    amount: number;
    @ApiProperty()
    amount_paid: number;
    @ApiProperty()
    amount_due: number;
    @ApiProperty()
    currency: string;
    @ApiPropertyOptional()
    receipt?: string;
    @ApiPropertyOptional()
    offer_id?: string;
    @ApiProperty()
    status: string; // e.g., 'created'
    @ApiProperty()
    attempts: number;
    @ApiProperty({ type: 'array', isArray: true })
    notes: any[];
    @ApiProperty()
    created_at: number; // timestamp
}

export class VerifyPaymentDto {
    @ApiProperty({ description: 'Razorpay Order ID' })
    @IsString()
    @IsNotEmpty()
    razorpay_order_id: string;

    @ApiProperty({ description: 'Razorpay Payment ID' })
    @IsString()
    @IsNotEmpty()
    razorpay_payment_id: string;

    @ApiProperty({ description: 'Razorpay Signature for verification' })
    @IsString()
    @IsNotEmpty()
    razorpay_signature: string;
}

export class VerifyPaymentResponseDto {
    @ApiProperty()
    @IsBoolean()
    success: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    message?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentId?: string;
}

export class UpdateQuotationPaymentDto {
    @ApiProperty({ description: 'Indicates if this is an advance payment or balance payment. True for advance, false for balance.' })
    @IsBoolean()
    isAdvancePaid: boolean; 

    @ApiProperty({ description: 'Order ID from the payment gateway' })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({ description: 'Payment ID from the payment gateway' })
    @IsString()
    @IsNotEmpty()
    paymentId: string;

    @ApiProperty({ description: 'Amount paid' })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ description: 'Payment method from Razorpay' })
    @IsString()
    razorpayPaymentMethod: string;

    @ApiProperty({ description: 'Currency of the payment' })
    @IsString()
    currency: string;

    @ApiPropertyOptional({ description: 'Bank associated with the payment', required: false })
    @IsString()
    @IsOptional()
    bank?: string;

    @ApiPropertyOptional({ description: 'Wallet associated with the payment', required: false })
    @IsString()
    @IsOptional()
    wallet?: string;

    @ApiProperty({ description: 'Fee charged by Razorpay' })
    @IsNumber()
    fee: number;

    @ApiProperty({ description: 'Tax charged for the payment' })
    @IsNumber()
    tax: number;

    @ApiProperty({ description: 'Date of the payment' })
    @IsDateString()
    paymentDate: Date;
}

export class TransactionResponseDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    _id: Types.ObjectId;

    @ApiProperty({ type: String })
    @IsMongoId()
    quotationId: Types.ObjectId;

    @ApiProperty({ type: String })
    @IsMongoId()
    userId: Types.ObjectId;

    @ApiProperty()
    @IsString()
    paymentId: string;

    @ApiProperty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty({ enum: PaymentType })
    @IsEnum(PaymentType)
    paymentType: PaymentType;

    @ApiProperty({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({ enum: PaymentStatus })
    @IsEnum(PaymentStatus)
    status: PaymentStatus;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    paymentDate: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}

// Generic response DTOs
export class SuccessResponseDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    success: boolean;

    @ApiPropertyOptional({ example: 'Operation completed successfully.' })
    @IsString()
    @IsOptional()
    message?: string;
}

export class UploadFilesBodyDto {
    @ApiPropertyOptional({ description: 'Optional folder name to store files in Cloudinary' })
    @IsString()
    @IsOptional()
    folder?: string;
}

class QuotationDetailsForTransactionsDto {
    @ApiProperty({ description: 'The ID of the quotation.'})
    @Expose()
    @IsMongoId()
    _id: Types.ObjectId;

    @ApiProperty({ description: 'The name of the quotation.', example: 'Logo Design for MyBrand' })
    @Expose()
    @IsString()
    title: string;
}

export class TransactionItemDto {
    @ApiProperty({ description: 'The unique identifier of the transaction.', example: '682326516358a4ebb22a055c' })
    @Expose()
    _id: Types.ObjectId;
  
    @ApiProperty({ description: 'Details of the associated quotation.' })
    @Expose()
    @Type(() => QuotationDetailsForTransactionsDto)
    quotationId: QuotationDetailsForTransactionsDto;
  
    @ApiProperty({ description: 'The amount of the transaction.', example: 900 })
    @Expose()
    amount: number;
  
    @ApiProperty({ description: 'The type of payment (e.g., advance, balance).', example: 'advance' })
    @Expose()
    paymentType: PaymentType;
  
    @ApiProperty({ description: 'The status of the payment.', example: 'completed' })
    @Expose()
    status: PaymentStatus;
  
    @ApiProperty({ description: 'The date of the payment.', example: '2025-05-13T11:00:33.490Z' })
    @Expose()
    paymentDate: Date;

    @ApiProperty({ description: 'The payment ID from the gateway.' })
    @Expose()
    paymentId: string;

    @ApiProperty({ description: 'The order ID from the gateway.' })
    @Expose()
    orderId: string;

    @ApiProperty({ description: 'The payment method used.' })
    @Expose()
    razorpayPaymentMethod: string;

    @ApiProperty({ description: 'The currency of the transaction.' })
    @Expose()
    currency: string;

    @ApiProperty({ description: 'The bank used for the payment.', required: false })
    @Expose()
    bank?: string;

    @ApiProperty({ description: 'The wallet used for the payment.', required: false })
    @Expose()
    wallet?: string;

    @ApiProperty({ description: 'The fee charged by the gateway.' })
    @Expose()
    fee: number;

    @ApiProperty({ description: 'The tax applied to the transaction.' })
    @Expose()
    tax: number;
}

export class PaginatedTransactionsResponseDto {
    @ApiProperty({ type: [TransactionItemDto], description: 'The list of transactions for the current page.' })
    @Expose()
    @Type(() => TransactionItemDto)
    transactions: TransactionItemDto[];
  
    @ApiProperty({ description: 'The total number of transactions available.', example: 50 })
    @Expose()
    totalItems: number;
  
    @ApiProperty({ description: 'The total number of pages.', example: 5 })
    @Expose()
    totalPages: number;
  
    @ApiProperty({ description: 'The current page number.', example: 1 })
    @Expose()
    currentPage: number;
  
    @ApiProperty({ description: 'The number of items per page.', example: 10 })
    @Expose()
    limit: number;
}

export class EditorPublicProfileResponseDto {
    @ApiProperty({ description: "Editor's user ID", example: '60d21b4667d0d8992e610c85' })
    @IsMongoId()
    _id: Types.ObjectId;

    @ApiProperty({ description: "Editor's username", example: 'john.doe' })
    @IsString()
    username: string;

    @ApiProperty({ description: "Editor's full name", example: 'John Doe' })
    @IsString()
    fullname: string;

    @ApiProperty({ description: 'URL of the profile image', example: 'https://example.com/avatar.jpg' })
    @IsString()
    @IsUrl()
    profileImage: string;

    @ApiProperty({ description: "Editor's score", example: 9250 })
    @IsNumber()
    score: number;

    @ApiProperty({ description: 'Average rating of the editor', example: 4.5 })
    @IsNumber()
    @Min(0)
    @Max(5)
    averageRating: number;

    @ApiProperty({ description: 'Specialization categories', example: ['UI/UX Design', 'Web Development'] })
    @IsArray()
    @IsString({ each: true })
    categories: string[];

    @ApiProperty({ description: 'A short bio about the editor', example: 'Passionate designer and developer.' })
    @IsString()
    about: string;

    @ApiProperty({ description: 'Shared tutorials by the editor', isArray: true, type: 'string', example: ['tutorial_link_1', 'tutorial_link_2'] })
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    sharedTutorials?: string[];

    @ApiProperty({ description: 'Tips and tricks from the editor', example: 'Always use version control!' })
    @IsString()
    @IsOptional()
    tipsAndTricks?: string;

    @ApiProperty({ 
        description: 'Social media links of the editor', 
        example: { 
            linkedIn: 'https://linkedin.com/in/editor',
            website: 'https://editor.com'
        }
    })
    @IsObject()
    @IsOptional()
    socialLinks?: Record<string, string>;

    @IsNumber()
    followersCount: number;

    @IsNumber()
    followingCount: number;

    @IsBoolean()
    isFollowing: boolean;
}

export class GetUsersQueryDto {
    @ApiProperty({ required: false, default: 1, description: 'Page number' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number;

    @ApiProperty({ required: false, default: 10, description: 'Number of items per page' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number;
}

export class GetPublicEditorsDto {
    @ApiPropertyOptional({ description: 'Search term for filtering public editors' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by category', example: 'audio' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({ description: 'Filter by rating (1-5)' })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    limit?: number;
}

export class PublicEditorProfileDto {
    @ApiProperty({ description: 'Editor ID' })
    _id: Types.ObjectId;

    @ApiProperty({ description: 'Editor full name' })
    fullname: string;

    @ApiProperty({ description: 'Editor username' })
    username: string;

    @ApiPropertyOptional({ description: 'Editor profile image URL' })
    profileImage?: string;

    @ApiProperty({ description: 'Editor categories' })
    categories: string[];

    @ApiProperty({ description: 'Editor score' })
    score: number;

    @ApiProperty({ description: 'Editor average rating' })
    averageRating: number;

    @ApiProperty({ description: 'Editor is verified' })
    isVerified: boolean;
}

export class PaginatedPublicEditorsDto {
    @ApiProperty({ description: 'List of public editors' })
    data: PublicEditorProfileDto[];

    @ApiProperty({ description: 'Total number of public editors' })
    total: number;

    @ApiProperty({ description: 'Current page number' })
    page: number;

    @ApiProperty({ description: 'Number of items per page' })
    limit: number;
}

export class ReportUserDto {
  @IsString()
  @IsNotEmpty()
  reportedUserId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([ReportContext.CHAT, ReportContext.QUOTATION])
  context: ReportContext;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  additionalContext?: string;
}