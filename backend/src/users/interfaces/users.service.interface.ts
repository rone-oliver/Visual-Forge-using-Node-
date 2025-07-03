import { Types } from 'mongoose';
import {
    UserProfileResponseDto,
    EditorRequestStatusResponseDto,
    GetQuotationsParamsDto,
    PaginatedQuotationsResponseDto,
    QuotationResponseDto,
    CreateQuotationDto,
    UpdateQuotationDto,
    UpdateProfileDto,
    ResetPasswordDto,
    CompletedWorkDto,
    RateEditorDto,
    UserBasicInfoDto,
    BidResponseDto,
    TransactionResponseDto,
    SuccessResponseDto,
    UserBaseResponseDto,
    UserEditorRatingDto,
    PaginatedTransactionsResponseDto,
    EditorPublicProfileResponseDto,
    GetPublicEditorsDto,
    PaginatedPublicEditorsDto,
    ReportUserDto
} from '../dto/users.dto';
import { User } from '../models/user.schema';
import { PaymentType } from 'src/common/models/transaction.schema';
import { Bid } from 'src/common/bids/models/bids.schema';
import { FileUploadResultDto as FileUploadResultDtoCloudinary } from 'src/common/cloudinary/dtos/cloudinary.dto';
import { GetAllUsersQueryDto } from 'src/admins/dto/admin.dto';
import { GetPublicWorksQueryDto, PaginatedPublicWorksResponseDto, RateWorkDto, UpdateWorkPublicStatusDto } from 'src/works/dtos/works.dto';

export const IUsersServiceToken = Symbol('IUsersService');

export interface UserInfoForChatListDto {
    _id: Types.ObjectId;
    username: string;
    profileImage?: string;
}

export interface IUsersService {
    getAllUsersForAdmin(query: GetAllUsersQueryDto): Promise<User[]>;
    getUserById(userId: Types.ObjectId): Promise<User | null>;
    makeUserEditor(userId: Types.ObjectId): Promise<User | null>;
    blockUser(userId: Types.ObjectId): Promise<User | null>;
    countAllUsers(): Promise<number>;
    getUserDetails(userId: Types.ObjectId): Promise<UserProfileResponseDto | null>;
    requestForEditor(userId: Types.ObjectId): Promise<SuccessResponseDto>; // Assuming boolean maps to a success DTO
    getEditorRequestStatus(userId: Types.ObjectId): Promise<EditorRequestStatusResponseDto>;
    getEditorPublicProfile(editorId: string,currentUserId?:string): Promise<EditorPublicProfileResponseDto>;
    getPublicEditors(params: GetPublicEditorsDto): Promise<PaginatedPublicEditorsDto>;
    getTransactionHistory(userId: Types.ObjectId, params: { page: number, limit: number }): Promise<PaginatedTransactionsResponseDto>;

    getQuotations(userId: Types.ObjectId, params: GetQuotationsParamsDto): Promise<PaginatedQuotationsResponseDto>;
    getQuotation(quotationId: Types.ObjectId): Promise<QuotationResponseDto | null>;
    createQuotation(userId: Types.ObjectId, createQuotationDto: CreateQuotationDto): Promise<QuotationResponseDto>;
    updateQuotation(quotationId: Types.ObjectId, updateQuotationDto: UpdateQuotationDto): Promise<QuotationResponseDto | null>;
    deleteQuotation(quotationId: Types.ObjectId): Promise<SuccessResponseDto>;

    getCompletedWorks(userId: Types.ObjectId): Promise<CompletedWorkDto[]>;

    updateProfileImage(userId: Types.ObjectId, profileImageUrl: string): Promise<UserBaseResponseDto | null>;
    updateProfile(userId: Types.ObjectId, updateProfileDto: UpdateProfileDto): Promise<UserProfileResponseDto | null>;
    resetPassword(userId: Types.ObjectId, resetPasswordDto: ResetPasswordDto): Promise<SuccessResponseDto>;

    uploadFiles(files: Express.Multer.File[], folder?: string): Promise<FileUploadResultDtoCloudinary[]>;

    rateWork(workId: string, rateWorkDto: RateWorkDto): Promise<SuccessResponseDto>;
    updateWorkPublicStatus(workId: string, updateWorkPublicStatusDto: UpdateWorkPublicStatusDto): Promise<SuccessResponseDto>;

    rateEditor(userId: Types.ObjectId, rateEditorDto: RateEditorDto): Promise<SuccessResponseDto>;
    getCurrentEditorRating(userId: Types.ObjectId, editorId: string): Promise<UserEditorRatingDto | null>;

    getPublicWorks(params: GetPublicWorksQueryDto): Promise<PaginatedPublicWorksResponseDto>;

    // User retrieval methods (consider if these are admin-only or also for general users with specific contexts)
    getUser(userId: Types.ObjectId): Promise<UserBasicInfoDto | null>; // Simplified DTO for general fetching
    getUsers(currentUserId: Types.ObjectId): Promise<UserBasicInfoDto[]>; // For user search/listing, excluding sensitive data

    // Methods for Google Auth used by CommonService
    findByEmail(email: string): Promise<User | null>;
    createGoogleUser(userDto: Partial<User>): Promise<User>; 
    updateUserGoogleId(userId: Types.ObjectId, googleId: string): Promise<User | null>;

    // Chat related
    getUserInfoForChatList(userId: Types.ObjectId): Promise<UserInfoForChatListDto | null>;

    // Payment and Transaction related methods
    createTransaction(
        userId: Types.ObjectId,
        quotationId: Types.ObjectId,
        paymentDetails: {
            paymentId: string;
            orderId: string;
            amount: number;
            paymentType: PaymentType;
        },
    ): Promise<TransactionResponseDto | null>;
    getQuotationTransactions(quotationId: Types.ObjectId): Promise<TransactionResponseDto[]>;

    // Bid related methods
    getBidsByQuotation(quotationId: Types.ObjectId, userId: Types.ObjectId): Promise<BidResponseDto[]>;
    acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId): Promise<BidResponseDto>; 
    cancelAcceptedBid(bidId: Types.ObjectId, requesterId: Types.ObjectId): Promise<SuccessResponseDto>;
    getAcceptedBid(quotationId: Types.ObjectId, editorId: Types.ObjectId): Promise<Bid>;

    // Methods for user-auth
    findOne(filter: Partial<User>): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    createUser(user: Partial<User>): Promise<User>;
    updateOne(filter: Partial<User>, update: Partial<User>): Promise<void>;
    updatePassword(userId: Types.ObjectId, password: string): Promise<boolean>; // Covered by ResetPasswordDto

    reportUser(reportDto: ReportUserDto, reporterId: string): Promise<SuccessResponseDto>;

    followUser(sourceUserId: Types.ObjectId, targetUserId: Types.ObjectId): Promise<SuccessResponseDto>;
    unfollowUser(sourceUserId: Types.ObjectId, targetUserId: Types.ObjectId): Promise<SuccessResponseDto>;

    // Internal or less-exposed methods (might not need DTOs if purely internal, but good for consistency)

    // Helper methods (if they need to be part of the interface, otherwise keep private in service)
    // calculateAverageRating(ratings: any[] | undefined): number;
    // calculateQuotationAmounts(estimatedBudget: number): { advanceAmount: number; balanceAmount: number };
}
