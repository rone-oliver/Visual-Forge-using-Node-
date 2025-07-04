import { Types, UpdateQuery } from 'mongoose';
import { Editor } from '../models/editor.schema';
import {
    SubmitWorkBodyDto,
    CreateEditorBidBodyDto,
    UpdateEditorBidBodyDto,
    EditorDetailsResponseDto,
    FileUploadResultDto,
    BidResponseDto,
    AddTutorialDto,
    RemoveTutorialDto
} from '../dto/editors.dto';
import { EditorRequest } from '../models/editorRequest.schema';
import { FormattedEditor, GetEditorsQueryDto } from 'src/admins/dto/admin.dto';
import { CompletedWorkDto, FileAttachmentDto, GetAcceptedQuotationsQueryDto, GetPublishedQuotationsQueryDto, PaginatedAcceptedQuotationsResponseDto, PaginatedPublishedQuotationsResponseDto } from 'src/quotation/dtos/quotation.dto';
import { UserRatingForEditorDto } from 'src/users/dto/users.dto';

export const IEditorsServiceToken = Symbol('IEditorsServiceToken');

export interface IEditorsService {
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
    ): Promise<Omit<FileAttachmentDto,'url'>[]>;

    submitQuotationResponse(
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

    // Editor requests
    getEditorRequests(): Promise<EditorRequest[]>;
    approveEditorRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<boolean>;
    rejectEditorRequest(requestId: Types.ObjectId, reason: string): Promise<boolean>;
    countEditorRequests(): Promise<number>;
    createEditorRequests(userId: Types.ObjectId): Promise<EditorRequest>;
    findEditorRequest(userId: Types.ObjectId): Promise<EditorRequest | null>;

    getEditorsForAdmin(query: GetEditorsQueryDto): Promise<{ editors: FormattedEditor[]; total: number }>;
    countAllEditors(): Promise<number>;

    findByUserId(userId: Types.ObjectId): Promise<Editor | null>;
    updateEditor(userId: Types.ObjectId, update: UpdateQuery<Editor>): Promise<Editor | null>;
    getEditorRating(userId: Types.ObjectId): Promise<Editor | null>;
    getEditorUserCombined(userId: Types.ObjectId): Promise<Editor | null>;
    getPublicEditors(pipeline: any[]): Promise<any[]>
}
