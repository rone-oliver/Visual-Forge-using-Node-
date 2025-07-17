import {
    UserEditorRatingDto,
    UserBasicInfoDto,
    RateEditorDto,
    SuccessResponseDto,
    UpdateProfileDto,
    PaginatedQuotationsResponseDto,
    CreateQuotationDto,
    UpdateQuotationDto, 
    EditorRequestStatusResponseDto,
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
import { FileUploadResultDto as FileUploadResultDtoCloudinary } from 'src/common/cloudinary/dtos/cloudinary.dto'; 
import { Bid } from 'src/common/bids/models/bids.schema';
import { GetPublicWorksQueryDto, PaginatedPublicWorksResponseDto, UpdateWorkPublicStatusDto } from 'src/works/dtos/works.dto';
import { CompletedWorkDto } from 'src/quotation/dtos/quotation.dto';

export interface IUsersController {
    getUserProfile(req: Request): Promise<UserProfileResponseDto>;
    requestForEditor(req: Request): Promise<SuccessResponseDto>;
    getEditorPublicProfile(id: string,currentUserId?:string): Promise<EditorPublicProfileResponseDto>;
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
    createQuotation(userId: string, quotation: CreateQuotationDto): Promise<SuccessResponseDto>;
    updateQuotation(quotationId: string, userId: string, dto: UpdateQuotationDto): Promise<QuotationResponseDto | null>;
    deleteQuotation(quotationId: string): Promise<SuccessResponseDto>;

    updateProfileImage(req: Request, dto: UpdateProfileImageDto): Promise<SuccessResponseDto>;
    updateProfile(req: Request, dto: UpdateProfileDto): Promise<SuccessResponseDto>;
    resetPassword(req: Request, dto: ResetPasswordDto): Promise<SuccessResponseDto>;

    uploadFile(
        req: Request,
        files: Express.Multer.File[],
        folder?: string,
    ): Promise<FileUploadResultDtoCloudinary[]>;

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

    followUser(id: string, userId: string): Promise<SuccessResponseDto>;
    unfollowUser(id: string, userId: string): Promise<SuccessResponseDto>;
}
