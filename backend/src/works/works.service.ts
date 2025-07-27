import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ICloudinaryService,
  ICloudinaryServiceToken,
} from 'src/common/cloudinary/interfaces/cloudinary-service.interface';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
import {
  ITimelineService,
  ITimelineServiceToken,
} from 'src/timeline/interfaces/timeline.service.interface';
import { TimelineEvent } from 'src/timeline/models/timeline.schema';
import {
  FileUploadResultDto,
  SuccessResponseDto,
} from 'src/users/dto/users.dto';

import {
  CreateWorkDto,
  GetPublicWorksQueryDto,
  PaginatedPublicWorksResponseDto,
  PublicWorkItemDto,
  RateWorkDto,
  TopEditorDto,
  UpdateWorkFilesDto,
  UpdateWorkPublicStatusDto,
  PopulatedWork,
} from './dtos/works.dto';
import {
  IWorkRepository,
  IWorkRepositoryToken,
} from './interfaces/works.repository.interface';
import { IWorkService } from './interfaces/works.service.interface';
import { Works } from './models/works.schema';

@Injectable()
export class WorksService implements IWorkService {
  private readonly _logger = new Logger(WorksService.name);

  constructor(
    @Inject(IWorkRepositoryToken)
    private readonly _workRepository: IWorkRepository,
    @Inject(ICloudinaryServiceToken)
    private readonly _cloudinaryService: ICloudinaryService,
    @Inject(ITimelineServiceToken)
    private readonly _timelineService: ITimelineService,
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
  ) {}

  async createWork(
    workData: CreateWorkDto,
    quotationId: string,
  ): Promise<Works> {
    try {
      const work = await this._workRepository.createWork(workData);
      await this._timelineService.create({
        quotationId: new Types.ObjectId(quotationId),
        event: TimelineEvent.FIRST_DRAFT_SUBMITTED,
        userId: new Types.ObjectId(workData.userId),
        editorId: new Types.ObjectId(workData.editorId),
        message: `Editor submitted ${workData.finalFiles.length} files`,
        metadata: {
          filesAdded: workData.finalFiles.length,
        },
      });
      return work;
    } catch (error) {
      this._logger.log('Failed to create work', error);
      throw error;
    }
  }

  async findById(workId: Types.ObjectId): Promise<Works | null> {
    try {
      return await this._workRepository.findById(workId);
    } catch (error) {
      this._logger.log('Failed to find work', error);
      throw error;
    }
  }

  async updateWork(
    workId: Types.ObjectId,
    updates: Partial<Works>,
  ): Promise<Works | null> {
    try {
      return await this._workRepository.updateOne(
        { _id: workId },
        { $set: updates },
      );
    } catch (error) {
      this._logger.log('Failed to update work', error);
      throw error;
    }
  }

  async getTwoRecentWorks(editorId: Types.ObjectId): Promise<Works[]> {
    try {
      return this._workRepository.getTwoRecentWorks(editorId);
    } catch (error) {
      this._logger.log('Failed to get two recent works', error);
      throw error;
    }
  }

  async rateWork(
    workId: string,
    rateWorkDto: RateWorkDto,
  ): Promise<SuccessResponseDto> {
    try {
      this._logger.log(
        'rating work:',
        workId,
        rateWorkDto.rating,
        rateWorkDto.feedback,
      );
      await this._workRepository.updateOne(
        { _id: new Types.ObjectId(workId) },
        {
          $set: {
            rating: rateWorkDto.rating,
            editorRating: rateWorkDto.editorRating,
            feedback: rateWorkDto.feedback,
          },
        },
      );
      this._logger.log('rating work success');
      return { success: true, message: 'Work rated successfully' };
    } catch (error) {
      this._logger.error('Failed to rate work', error);
      throw error;
    }
  }

  async updateWorkPublicStatus(
    workId: string,
    updateWorkPublicStatusDto: UpdateWorkPublicStatusDto,
  ): Promise<SuccessResponseDto> {
    try {
      await this._workRepository.updateOne(
        { _id: new Types.ObjectId(workId) },
        { $set: { isPublic: updateWorkPublicStatusDto.isPublic } },
      );
      this._logger.log('Work Public status updated');
      return { success: true, message: 'Work Public status updated' };
    } catch (error) {
      this._logger.error('Failed to update work public status');
      throw error;
    }
  }

  async updateWorkFiles(
    workId: string,
    files: Express.Multer.File[],
    updateWorkFilesDto: UpdateWorkFilesDto,
  ): Promise<SuccessResponseDto> {
    try {
      const work = await this._workRepository.findById(
        new Types.ObjectId(workId),
      );
      if (!work) {
        throw new Error('Work not found');
      }
      const filesAddedCount = files?.length || 0;
      const filesDeletedCount = updateWorkFilesDto.deleteFileIds?.length || 0;

      if (
        updateWorkFilesDto.deleteFileIds &&
        updateWorkFilesDto.deleteFileIds.length > 0
      ) {
        const idsToDelete = updateWorkFilesDto.deleteFileIds;
        const filesToDelete = work.finalFiles.filter((file) =>
          idsToDelete.includes(file.uniqueId),
        );
        const deletePromises = filesToDelete.map((file) =>
          this._cloudinaryService.deleteFile(file.uniqueId, file.fileType),
        );
        await Promise.all(deletePromises);
        this._logger.log('Files deleted successfully');
        work.finalFiles = work.finalFiles.filter(
          (file) => !idsToDelete.includes(file.uniqueId),
        );
      }

      if (files && files.length > 0) {
        const uploadedFiles = await this._cloudinaryService.uploadFiles(
          files,
          'Visual Forge/Work Files',
        );
        work.finalFiles.push(...uploadedFiles);
        this._logger.log('Files uploaded successfully');
      }

      await this._workRepository.updateOne(
        { _id: new Types.ObjectId(workId) },
        { $set: { finalFiles: work.finalFiles } },
      );

      const quotation = await this._quotationService.findOne({
        worksId: new Types.ObjectId(workId),
      });
      if (!quotation) {
        throw new Error('Quotation not found');
      }

      await this._timelineService.create({
        quotationId: new Types.ObjectId(quotation._id),
        event: TimelineEvent.WORK_REVISED,
        userId: new Types.ObjectId(quotation.userId),
        editorId: new Types.ObjectId(quotation.editorId),
        message: `Editor updated files: ${filesAddedCount} added, ${filesDeletedCount} removed.`,
        metadata: {
          filesAdded: filesAddedCount,
          filesRemoved: filesDeletedCount,
        },
      });

      return { success: true, message: 'Work files updated successfully' };
    } catch (error) {
      this._logger.error('Failed to update work files', error);
      throw error;
    }
  }

  async getPublicWorks(
    params: GetPublicWorksQueryDto,
  ): Promise<PaginatedPublicWorksResponseDto> {
    try {
      const [works, total] = await this._workRepository.getPublicWorks(params);

      const publicWorksDto: PublicWorkItemDto[] = works.map(
        (work: PopulatedWork) => {
          const editorInfo = work.editorId;
          const userInfo = work.userId;

          if (!editorInfo || !userInfo) {
            this._logger.error('Editor or User not found');
            throw new Error('Editor or User not found');
          }

          return {
            _id: work._id.toString(),
            comments: work.comments,
            isPublic: !!work.isPublic,
            finalFiles:
              (work.finalFiles as unknown as FileUploadResultDto[]) || [],
            rating: work.rating,
            feedback: work.feedback,
            createdAt: work.createdAt,
            updatedAt: work.updatedAt,
            editor: {
              _id: editorInfo._id,
              fullname: editorInfo.fullname,
              username: editorInfo.username,
              email: editorInfo.email,
              profileImage: editorInfo.profileImage,
            },
            user: {
              _id: userInfo._id,
              fullname: userInfo.fullname,
              username: userInfo.username,
              email: userInfo.email,
              profileImage: userInfo.profileImage,
            },
          };
        },
      );

      return { works: publicWorksDto, total };
    } catch (error) {
      this._logger.error('Failed to get public works', error);
      throw error;
    }
  }

  async getTopEditorsByCompletedWorks(limit: number): Promise<TopEditorDto[]> {
    try {
      return this._workRepository.getTopEditorsByCompletedWorks(limit);
    } catch (error) {
      this._logger.error('Failed to get top editors by completed works', error);
      throw error;
    }
  }

  async getAverageEditorRating(
    editorId: Types.ObjectId
  ): Promise<{ averageRating: number; count: number; } | null> {
    try {
      return this._workRepository.getAverageEditorRating(editorId);
    } catch (error) {
      this._logger.error('Failed to get average editor rating', error);
      throw error;
    }
  }
}
