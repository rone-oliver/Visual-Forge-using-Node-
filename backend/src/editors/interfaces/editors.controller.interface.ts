import {
    GetPublishedQuotationsQueryDto,
    GetAcceptedQuotationsQueryDto,
    PaginatedAcceptedQuotationsResponseDto,
    PaginatedPublishedQuotationsResponseDto,
    FileUploadResultDto,
    SubmitWorkBodyDto,
    CreateEditorBidBodyDto,
    UpdateEditorBidBodyDto,
    BidResponseDto,
    CompletedWorkDto,
} from '../dto/editors.dto';
import { QuotationStatus } from 'src/common/models/quotation.schema';

export interface IEditorsController {
    getQuotations(
        req: Request, 
        status: QuotationStatus, 
        queryDto: GetPublishedQuotationsQueryDto & GetAcceptedQuotationsQueryDto
    ): Promise<PaginatedAcceptedQuotationsResponseDto | PaginatedPublishedQuotationsResponseDto>;

    uploadWorkFiles(
        req: Request, 
        files: Express.Multer.File[], 
        folder?: string 
    ): Promise<FileUploadResultDto[]>;

    submitQuotationResponse(
        req: Request, 
        workData: SubmitWorkBodyDto
    ): Promise<boolean>;

    getCompletedWorks(req: Request): Promise<CompletedWorkDto[]>;

    createBid(
        bidData: CreateEditorBidBodyDto, 
        req: Request
    ): Promise<BidResponseDto>;

    updateBid(
        bidId: string, 
        bidData: UpdateEditorBidBodyDto, 
        req: Request
    ): Promise<BidResponseDto>;

    deleteBid(
        bidId: string, 
        req: Request
    ): Promise<void>;
}
