import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { FormattedEditor, GetEditorsQueryDto } from 'src/admins/dto/admin.dto';
import {
  CompletedWorkDto,
  FileAttachmentDto,
  GetAcceptedQuotationsQueryDto,
  GetPublishedQuotationsQueryDto,
  PaginatedAcceptedQuotationsResponseDto,
  PaginatedPublishedQuotationsResponseDto,
} from 'src/quotation/dtos/quotation.dto';
import {
  SuccessResponseDto,
} from 'src/users/dto/users.dto';
import { UpdateWorkFilesDto } from 'src/works/dtos/works.dto';

import {
  SubmitWorkBodyDto,
  CreateEditorBidBodyDto,
  UpdateEditorBidBodyDto,
  EditorDetailsResponseDto,
  BidResponseDto,
  AddTutorialDto,
  RemoveTutorialDto,
  GetBiddedQuotationsQueryDto,
  PaginatedBiddedQuotationsResponseDto,
  EditorBidDto,
} from '../../dto/editors.dto';
import { Editor } from 'src/editors/models/editor.schema';
import { EditorRequest } from 'src/editors/models/editorRequest.schema';

export const IEditorsServiceToken = Symbol('IEditorsServiceToken');

export interface IEditorsService {
  getPublishedQuotations(
    editorId: Types.ObjectId,
    params: GetPublishedQuotationsQueryDto,
  ): Promise<PaginatedPublishedQuotationsResponseDto>;

  getAcceptedQuotations(
    editorId: Types.ObjectId,
    params: GetAcceptedQuotationsQueryDto,
  ): Promise<PaginatedAcceptedQuotationsResponseDto>;

  uploadWorkFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<Omit<FileAttachmentDto, 'url'>[]>;

  submitQuotationResponse(workData: SubmitWorkBodyDto): Promise<boolean>;

  updateWorkFiles(
    workId: string,
    files: Express.Multer.File[],
    updateWorkFilesDto: UpdateWorkFilesDto,
  ): Promise<SuccessResponseDto>;

  getCompletedWorks(editorId: Types.ObjectId): Promise<CompletedWorkDto[]>;

  getEditor(editorId: string): Promise<EditorDetailsResponseDto | null>;

  createBid(
    editorId: Types.ObjectId,
    bidDto: CreateEditorBidBodyDto,
  ): Promise<BidResponseDto>;

  updateBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
    bidDto: UpdateEditorBidBodyDto,
  ): Promise<BidResponseDto>;

  cancelAcceptedBid(
    bidId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<SuccessResponseDto>;

  deleteBid(bidId: Types.ObjectId, editorId: Types.ObjectId): Promise<void>;

  addTutorial(
    editorId: string,
    addTutorialDto: AddTutorialDto,
  ): Promise<Editor>;
  removeTutorial(
    editorId: string,
    removeTutorialDto: RemoveTutorialDto,
  ): Promise<Editor>;

  getEditorsForAdmin(
    query: GetEditorsQueryDto,
  ): Promise<{ editors: FormattedEditor[]; total: number }>;
  countAllEditors(): Promise<number>;
  findMany(filter: FilterQuery<Editor>): Promise<Editor[] | null>;

  findByUserId(userId: Types.ObjectId): Promise<Editor | null>;
  updateEditor(
    userId: Types.ObjectId,
    update: UpdateQuery<Editor>,
  ): Promise<Editor | null>;
  getEditorRating(userId: Types.ObjectId): Promise<Editor | null>;
  getEditorUserCombined(userId: Types.ObjectId): Promise<Editor | null>;
  getPublicEditors(pipeline: any[]): Promise<any[]>;

  getBiddedQuotations(
    editorId: string,
    query: GetBiddedQuotationsQueryDto,
  ): Promise<PaginatedBiddedQuotationsResponseDto>;
  getEditorBidForQuotation(
    quotationId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<EditorBidDto>;

  // Editor Requests
  getEditorRequests(): Promise<EditorRequest[]>;
  approveEditorRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
  ): Promise<boolean>;
  rejectEditorRequest(
    requestId: Types.ObjectId,
    reason: string,
  ): Promise<boolean>;
  countEditorRequests(): Promise<number>;
  checkEditorRequest(userId: Types.ObjectId): Promise<boolean>;
  deleteEditorRequest(userId: Types.ObjectId): Promise<EditorRequest | null>;
  createEditorRequest(userId: Types.ObjectId): Promise<EditorRequest>;
  findEditorRequest(userId: Types.ObjectId): Promise<EditorRequest | null>;
}
