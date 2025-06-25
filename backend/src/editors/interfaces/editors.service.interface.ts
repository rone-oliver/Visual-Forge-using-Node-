import { Types } from 'mongoose';
import { Editor } from '../models/editor.schema';
import {
    GetPublishedQuotationsQueryDto,
    GetAcceptedQuotationsQueryDto,
    SubmitWorkBodyDto,
    CreateEditorBidBodyDto,
    UpdateEditorBidBodyDto,
    EditorDetailsResponseDto,
    PaginatedAcceptedQuotationsResponseDto,
    FileUploadResultDto,
    BidResponseDto,
    CompletedWorkDto,
    PaginatedPublishedQuotationsResponseDto,
    AddTutorialDto,
    RemoveTutorialDto
} from '../dto/editors.dto';

export const IEditorsServiceToken = Symbol('IEditorsServiceToken');

export interface IEditorsService {
    createEditor(editorDto: Partial<Editor>): Promise<Editor>; // Assuming Editor from schema is fine for creation context

    getPublishedQuotations(
        editorId: Types.ObjectId,
        params: GetPublishedQuotationsQueryDto
    ): Promise<PaginatedPublishedQuotationsResponseDto>;

    getAcceptedQuotations(
        editorId: Types.ObjectId,
        params: GetAcceptedQuotationsQueryDto
    ): Promise<PaginatedAcceptedQuotationsResponseDto>;

    uploadWorkFiles(
        files: Express.Multer.File[], 
        folder?: string
    ): Promise<FileUploadResultDto[]>;

    submitQuotationResponse(
        editorId: Types.ObjectId, 
        workData: SubmitWorkBodyDto
    ): Promise<boolean>;

    getCompletedWorks(editorId: Types.ObjectId): Promise<CompletedWorkDto[]>;

    getEditor(editorId: string): Promise<EditorDetailsResponseDto | null>;

    createBid(
        editorId: Types.ObjectId, 
        bidDto: CreateEditorBidBodyDto
    ): Promise<BidResponseDto>;

    updateBid(
        bidId: Types.ObjectId, 
        editorId: Types.ObjectId, 
        bidDto: UpdateEditorBidBodyDto
    ): Promise<BidResponseDto>;

    deleteBid(bidId: Types.ObjectId, editorId: Types.ObjectId): Promise<void>;

    addTutorial(editorId: string, addTutorialDto: AddTutorialDto): Promise<Editor>;
    removeTutorial(editorId: string, removeTutorialDto: RemoveTutorialDto): Promise<Editor>;
}
