import {
    UserEditorRatingDto,
    UpdateWorkPublicStatusDto,
    UserBasicInfoDto,
    PaginatedPublicWorksResponseDto,
    GetPublicWorksQueryDto,
    RateEditorDto,
    SuccessResponseDto,
    UpdateProfileDto,
    PaginatedQuotationsResponseDto,
    CreateQuotationDto,
    UpdateQuotationDto, 
    EditorRequestStatusResponseDto,
    CompletedWorkDto,
    QuotationResponseDto,
    UpdateProfileImageDto,
    ResetPasswordDto,
    CreatePaymentDto,
    CreatePaymentResponseDto,
    VerifyPaymentDto,
    VerifyPaymentResponseDto,
    UpdateQuotationPaymentDto,
    UserProfileResponseDto,
    GetQuotationsParamsDto,
    PaginatedTransactionsResponseDto,
    EditorPublicProfileResponseDto,
    GetPublicEditorsDto,
    PaginatedPublicEditorsDto,
    ReportUserDto,
} from '../dto/users.dto';
import { BidResponseDto } from '../dto/users.dto';
import { FileUploadResult } from 'src/common/cloudinary/cloudinary.service'; 
import { User } from '../models/user.schema';
import { Types } from 'mongoose';
import { Bid } from 'src/common/bids/models/bids.schema';

export interface IUsersController {
    getUserProfile(req: Request): Promise<UserProfileResponseDto>;
    requestForEditor(req: Request): Promise<SuccessResponseDto>;
    getEditorPublicProfile(id: string): Promise<EditorPublicProfileResponseDto>;
    getPublicEditors(query: GetPublicEditorsDto): Promise<PaginatedPublicEditorsDto>;
    getEditorRequestStatus(req: Request): Promise<EditorRequestStatusResponseDto>;
    getTransactionHistory(
        req: Request,
        query: GetQuotationsParamsDto,
    ): Promise<PaginatedTransactionsResponseDto>;

    getQuotations(
        req: Request,
        query: GetQuotationsParamsDto,
    ): Promise<PaginatedQuotationsResponseDto>;
    getCompletedWorks(req: Request): Promise<CompletedWorkDto[]>;
    getQuotation(quotationId: string): Promise<QuotationResponseDto | null>;
    getBidsByQuotation(quotationId: string, req: Request): Promise<BidResponseDto[]>;
    createQuotation(req: Request, body:{quotation: CreateQuotationDto}): Promise<SuccessResponseDto>;
    updateQuotation(quotationId: string, dto: UpdateQuotationDto): Promise<QuotationResponseDto | null>;
    deleteQuotation(quotationId: string): Promise<SuccessResponseDto>;

    updateProfileImage(req: Request, dto: UpdateProfileImageDto): Promise<SuccessResponseDto>;
    updateProfile(req: Request, dto: UpdateProfileDto): Promise<SuccessResponseDto>;
    resetPassword(req: Request, dto: ResetPasswordDto): Promise<SuccessResponseDto>;

    uploadFile(
        req: Request,
        files: Express.Multer.File[],
        folder?: string,
    ): Promise<FileUploadResult[]>;

    rateWork(
        req: Request,
        workId: string,
        dto: UserEditorRatingDto,
    ): Promise<boolean>;
    updateWorkPublicStatus(
        req: Request,
        workId: string,
        dto: UpdateWorkPublicStatusDto,
    ): Promise<boolean>;
    rateEditor(req: Request, dto: RateEditorDto): Promise<SuccessResponseDto>;
    getCurrentEditorRating(req: Request, editorId: string): Promise<UserEditorRatingDto | null>;

    getPublicWorks(
        query: GetPublicWorksQueryDto,
    ): Promise<PaginatedPublicWorksResponseDto>;
    // getUser(id: string): Promise<UserBasicInfoDto>;
    getUsers(req: Request): Promise<UserBasicInfoDto[]>;

    // getEditor(id: string): Promise<EditorDetailsResponseDto | null>;

    createPayment(
        req: Request,
        dto: CreatePaymentDto,
    ): Promise<CreatePaymentResponseDto>;
    verifyPayment(
        req: Request,
        dto: VerifyPaymentDto,
    ): Promise<VerifyPaymentResponseDto>;
    updateQuotationPayment(
        req: Request,
        quotationId: string,
        dto: UpdateQuotationPaymentDto,
    ): Promise<SuccessResponseDto>;

    acceptBid(bidId: string, req: Request): Promise<BidResponseDto>;
    getAcceptedBid(quotationId: string, editorId: string): Promise<Bid>;
    cancelAcceptedBid(bidId: string, requesterId: string): Promise<SuccessResponseDto>;

    reportUser(reportDto: ReportUserDto, userId: string): Promise<SuccessResponseDto>;
}
