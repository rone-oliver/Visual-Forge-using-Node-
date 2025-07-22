import { Types } from 'mongoose';
import {
  CompletedWorkDto,
  FileAttachmentDto,
} from 'src/quotation/dtos/quotation.dto';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { UpdateWorkFilesDto } from 'src/works/dtos/works.dto';

import { SubmitWorkBodyDto } from '../../dto/editors.dto';

export const IEditorWorkServiceToken = Symbol('IEditorWorkService');

export interface IEditorWorkService {
  submitQuotationResponse(
    workData: SubmitWorkBodyDto,
  ): Promise<SuccessResponseDto>;
  getCompletedWorks(editorId: Types.ObjectId): Promise<CompletedWorkDto[]>;
  uploadWorkFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<Omit<FileAttachmentDto, 'url'>[]>;
  updateWorkFiles(
    workId: string,
    files: Express.Multer.File[],
    updateWorkFilesDto: UpdateWorkFilesDto,
  ): Promise<SuccessResponseDto>;
}
