import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import {
    ICloudinaryService,
    ICloudinaryServiceToken,
} from 'src/common/cloudinary/interfaces/cloudinary-service.interface';
import { EventTypes } from 'src/common/constants/events.constants';
import {
    CompletedWorkDto,
    FileAttachmentDto,
} from 'src/quotation/dtos/quotation.dto';
import {
    IQuotationService,
    IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
import { QuotationStatus } from 'src/quotation/models/quotation.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { UpdateWorkFilesDto } from 'src/works/dtos/works.dto';
import {
    IWorkService,
    IWorkServiceToken,
} from 'src/works/interfaces/works.service.interface';
import { SubmitWorkBodyDto } from '../dto/editors.dto';
import {
    IEditorRepository,
    IEditorRepositoryToken,
} from '../interfaces/editor.repository.interface';
import { NotificationType } from 'src/notification/models/notification.schema';
import { IEditorWorkService } from '../interfaces/services/editor-work.service.interface';

@Injectable()
export class EditorWorkService implements IEditorWorkService {
    private readonly _logger = new Logger(EditorWorkService.name);
    constructor(
        @Inject(IQuotationServiceToken)
        private readonly _quotationService: IQuotationService,
        @Inject(IWorkServiceToken) private readonly _worksService: IWorkService,
        @Inject(ICloudinaryServiceToken)
        private readonly _cloudinaryService: ICloudinaryService,
        @Inject(IEditorRepositoryToken)
        private readonly _editorRepository: IEditorRepository,
        private _eventEmitter: EventEmitter2,
    ) { }

    async submitQuotationResponse(workData: SubmitWorkBodyDto): Promise<SuccessResponseDto> {
        try {
            const { quotationId, finalFiles, comments } = workData;
            const quotation = await this._quotationService.findById(
                new Types.ObjectId(quotationId),
            );
            if (!quotation) {
                this._logger.warn(`Quotation with ID ${quotationId} not found`);
                return { success: false, message: 'Quotation not found' };
            }

            const submissionDate = new Date();
            const penalty = this._calculatePenalty(
                quotation.dueDate,
                submissionDate,
                quotation.estimatedBudget,
            );

            const work = await this._worksService.createWork(
                {
                    editorId: new Types.ObjectId(quotation.editorId),
                    userId: new Types.ObjectId(quotation.userId),
                    finalFiles: finalFiles.map((file) => {
                        const processedUniqueId = file.uniqueId
                            ? String(file.uniqueId).replace(/ /g, '%20')
                            : '';

                        return {
                            ...file,
                            uniqueId: `${processedUniqueId}.${file.format}`,
                            timestamp: file.timestamp,
                            uploadedAt: file.uploadedAt ?? new Date(),
                        };
                    }),
                    comments: comments ?? '',
                },
                workData.quotationId,
            );
            await this._quotationService.updateQuotationStatus(
                quotation._id,
                QuotationStatus.COMPLETED,
                work._id,
                penalty,
            );

            this._eventEmitter.emit(EventTypes.QUOTATION_COMPLETED, {
                userId: quotation.userId,
                type: NotificationType.WORK,
                message: `Your work "${quotation.title}" has been completed`,
                data: { title: quotation.title },
                quotationId: quotation._id,
                worksId: work._id,
            });

            await this._updateEditorScore(quotation.editorId);
            return { success: true, message: 'Quotation response submitted successfully' };
        } catch (error) {
            this._logger.error('Error submitting the quotation response', error);
            throw new Error('Error submitting the quotation response');
        }
    }

    async getCompletedWorks(
        editorId: Types.ObjectId,
    ): Promise<CompletedWorkDto[]> {
        return this._quotationService.getCompletedQuotations(editorId);
    }

    async uploadWorkFiles(
        files: Express.Multer.File[],
        folder?: string,
    ): Promise<Omit<FileAttachmentDto, 'url'>[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded.');
        }
        const uploadResults = await this._cloudinaryService.uploadFiles(
            files,
            folder,
        );
        return uploadResults.map((result) => ({
            fileType: result.fileType,
            fileName: result.fileName,
            size: result.size,
            mimeType: result.mimeType,
            uploadedAt: result.uploadedAt,
            uniqueId: result.uniqueId,
            timestamp: result.timestamp,
            format: result.format,
        }));
    }

    async updateWorkFiles(
        workId: string,
        files: Express.Multer.File[],
        updateWorkFilesDto: UpdateWorkFilesDto,
    ): Promise<SuccessResponseDto> {
        try {
            return await this._worksService.updateWorkFiles(
                workId,
                files,
                updateWorkFilesDto,
            );
        } catch (error) {
            this._logger.error(
                `Failed to update work files for work ${workId}`,
                error,
            );
            throw error;
        }
    }

    private _calculatePenalty(
        dueDate: Date,
        submissionDate: Date,
        amount: number,
    ): number {
        if (!dueDate) return 0;

        const delayInMs = submissionDate.getTime() - dueDate.getTime();
        const delayInHours = Math.ceil(delayInMs / (1000 * 60 * 60));

        if (delayInHours <= 2) {
            return 0; // Grace period
        }

        const effectiveDelayHours = Math.min(delayInHours, 24); // Cap at 24 hours

        let totalPenalty = 0;

        // Tier 1: 2-4 hours (0.5% per hour)
        if (effectiveDelayHours > 2) {
            const hoursInTier = Math.min(effectiveDelayHours, 4) - 2;
            totalPenalty += hoursInTier * 0.005 * amount;
        }

        // Tier 2: 4-8 hours (1% per hour)
        if (effectiveDelayHours > 4) {
            const hoursInTier = Math.min(effectiveDelayHours, 8) - 4;
            totalPenalty += hoursInTier * 0.01 * amount;
        }

        // Tier 3: 8-24 hours (1.5% per hour)
        if (effectiveDelayHours > 8) {
            const hoursInTier = effectiveDelayHours - 8;
            totalPenalty += hoursInTier * 0.015 * amount;
        }

        return parseFloat(totalPenalty.toFixed(2));
    }

    private async _updateEditorScore(editorId: Types.ObjectId): Promise<void> {
        if (!editorId) return;
        try {
            const editor = await this._editorRepository.findByUserId(editorId);
            if (!editor) {
                this._logger.warn(
                    `Editor with ID ${editorId} not found or not an editor`,
                );
                return;
            }

            const recentWorks = await this._worksService.getTwoRecentWorks(editorId);

            const scoreIncrement = 10;
            let currentStreak = editor.streak || 0;
            let streakMultiplier = 1;

            if (recentWorks.length > 1) {
                const latestWork = recentWorks[0];
                const previousWork = recentWorks[1];

                const latestDate = new Date(latestWork.createdAt);
                const previousDate = new Date(previousWork.createdAt);
                const daysDifference = Math.floor(
                    (latestDate.getTime() - previousDate.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                if (daysDifference < 7) {
                    currentStreak++;
                    streakMultiplier = Math.min(3, 1 + currentStreak * 0.1);
                } else {
                    currentStreak = 1;
                    streakMultiplier = 1;
                }
            } else {
                currentStreak = 1;
            }

            const finalScoreIncrement = Math.round(scoreIncrement * streakMultiplier);
            const newScore = (editor.score || 0) + finalScoreIncrement;

            await this._editorRepository.updateScore(
                editor._id,
                newScore,
                currentStreak,
            );

            this._logger.log(
                `Updated editor ${editorId} score to ${newScore} (streak: ${currentStreak}, multiplier: ${streakMultiplier})`,
            );
        } catch (error) {
            this._logger.error('Error updating editor score', error);
        }
    }
}
