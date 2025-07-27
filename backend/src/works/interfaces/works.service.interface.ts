import { Types } from 'mongoose';
import { SuccessResponseDto } from 'src/users/dto/users.dto';

import {
  CreateWorkDto,
  GetPublicWorksQueryDto,
  PaginatedPublicWorksResponseDto,
  RateWorkDto,
  TopEditorDto,
  UpdateWorkFilesDto,
  UpdateWorkPublicStatusDto,
} from '../dtos/works.dto';
import { Works } from '../models/works.schema';

export const IWorkServiceToken = Symbol('IWorkService');

export interface IWorkService {
  findById(workId: Types.ObjectId): Promise<Works | null>;
  createWork(workData: CreateWorkDto, quotationId: string): Promise<Works>;
  getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]>;
  rateWork(
    workId: string,
    rateWorkDto: RateWorkDto,
  ): Promise<SuccessResponseDto>;
  updateWorkPublicStatus(
    workId: string,
    updateWorkPublicStatusDto: UpdateWorkPublicStatusDto,
  ): Promise<SuccessResponseDto>;
  getPublicWorks(
    filter: GetPublicWorksQueryDto,
  ): Promise<PaginatedPublicWorksResponseDto>;
  updateWorkFiles(
    workId: string,
    files: Express.Multer.File[],
    updateWorkFilesDto: UpdateWorkFilesDto,
  ): Promise<SuccessResponseDto>;
  updateWork(
    workId: Types.ObjectId,
    updates: Partial<Works>,
  ): Promise<Works | null>;
  getTopEditorsByCompletedWorks(limit: number): Promise<TopEditorDto[]>;
  getAverageEditorRating(
    editorId: Types.ObjectId
  ): Promise<{ averageRating: number; count: number } | null>;
}
