import {
  CompletedWorkDto,
  FileAttachmentDto,
  GetAcceptedQuotationsQueryDto,
  GetPublishedQuotationsQueryDto,
  PaginatedAcceptedQuotationsResponseDto,
  PaginatedPublishedQuotationsResponseDto,
} from 'src/quotation/dtos/quotation.dto';
import { QuotationStatus } from 'src/quotation/models/quotation.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';

import {
  SubmitWorkBodyDto,
  CreateEditorBidBodyDto,
  UpdateEditorBidBodyDto,
  BidResponseDto,
  RemoveTutorialDto,
  AddTutorialDto,
  GetBiddedQuotationsQueryDto,
  PaginatedBiddedQuotationsResponseDto,
} from '../dto/editors.dto';
import { Editor } from '../models/editor.schema';

export interface IEditorsController {
  getQuotations(
    req: Request,
    status: QuotationStatus,
    queryDto: GetPublishedQuotationsQueryDto & GetAcceptedQuotationsQueryDto,
  ): Promise<
    | PaginatedAcceptedQuotationsResponseDto
    | PaginatedPublishedQuotationsResponseDto
  >;

  uploadWorkFiles(
    req: Request,
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<Omit<FileAttachmentDto, 'url'>[]>;

  submitQuotationResponse(
    req: Request,
    workData: SubmitWorkBodyDto,
  ): Promise<SuccessResponseDto>;

  getCompletedWorks(req: Request): Promise<CompletedWorkDto[]>;

  createBid(
    bidData: CreateEditorBidBodyDto,
    req: Request,
  ): Promise<BidResponseDto>;
  updateBid(
    bidId: string,
    bidData: UpdateEditorBidBodyDto,
    req: Request,
  ): Promise<BidResponseDto>;
  deleteBid(bidId: string, req: Request): Promise<void>;
  cancelAcceptedBid(bidId: string, userId: string): Promise<SuccessResponseDto>;
  getBiddedQuotations(
    editorId: string,
    query: GetBiddedQuotationsQueryDto,
  ): Promise<PaginatedBiddedQuotationsResponseDto>;

  removeTutorial(
    editorId: string,
    removeTutorialDto: RemoveTutorialDto,
  ): Promise<Editor>;
  addTutorial(
    addTutorialDto: AddTutorialDto,
    editorId: string,
  ): Promise<Editor>;
}
