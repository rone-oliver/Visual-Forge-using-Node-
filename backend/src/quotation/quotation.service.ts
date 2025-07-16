import { Inject, Injectable, Logger } from '@nestjs/common';
import { IQuotationService } from './interfaces/quotation.service.interface';
import { IQuotationRepository, IQuotationRepositoryToken } from './interfaces/quotation.repository.interface';
import { Quotation, QuotationDocument, QuotationStatus } from './models/quotation.schema';
import { AcceptedQuotationItemDto, CompletedWorkDto, GetAcceptedQuotationsQueryDto, GetPublishedQuotationsQueryDto, getQuotationsByStatusResponseDto, PaginatedAcceptedQuotationsResponseDto, PaginatedPublishedQuotationsResponseDto, PublishedQuotationItemDto } from './dtos/quotation.dto';
import { FilterQuery, PipelineStage, QueryOptions, Types, UpdateQuery } from 'mongoose';
import { WorksDocument } from 'src/works/models/works.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { TimelineEvent } from 'src/timeline/models/timeline.schema';
import { ITimelineService, ITimelineServiceToken } from 'src/timeline/interfaces/timeline.service.interface';

@Injectable()
export class QuotationService implements IQuotationService {
    private readonly logger = new Logger(QuotationService.name);
    constructor(
        @Inject(IQuotationRepositoryToken) private readonly quotationRepository: IQuotationRepository,
        @Inject(ITimelineServiceToken) private readonly timelineService: ITimelineService,
    ) { }

    async countAllQuotations(): Promise<number> {
        return this.quotationRepository.countDocuments();
    }

    async countQuotationsByFilter(filter: FilterQuery<Quotation>): Promise<number> {
        return this.quotationRepository.countDocuments(filter);
    }

    async getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto> {
        const quotationsByStatus = await this.quotationRepository.getQuotationsByStatus();
        const statusCounts = {
            [QuotationStatus.PUBLISHED]: 0,
            [QuotationStatus.ACCEPTED]: 0,
            [QuotationStatus.COMPLETED]: 0,
            [QuotationStatus.EXPIRED]: 0,
            [QuotationStatus.CANCELLED]: 0,
        };
        quotationsByStatus.forEach(status => {
            statusCounts[status._id] = status.count;
        });
        return statusCounts;
    }

    async getPublishedQuotations(editorId: Types.ObjectId, query: GetPublishedQuotationsQueryDto): Promise<PaginatedPublishedQuotationsResponseDto> {
        try {
            const results = await this.quotationRepository.getPublishedQuotations(editorId, query);
            const quotations = results[0].paginatedResults.map(q => ({
                ...q,
                _id: q._id.toString(),
                userId: q.userId?.toString(),
                editorId: q.editorId?.toString(),
                editorBid: q.editorBid ? { ...q.editorBid, bidId: q.editorBid.bidId?.toString() } : null,
            })) as PublishedQuotationItemDto[];

            const totalItems = results[0].totalCount.length > 0 ? results[0].totalCount[0].count : 0;
            this.logger.log('Published quotations fetched successfully for editor', editorId);
            return {
                quotations,
                totalItems,
                currentPage: query.page ?? 1,
                itemsPerPage: query.limit ?? 10,
            };
        } catch (error) {
            this.logger.error(`Error fetching published quotations for editor ${editorId}: ${error.message}`, error.stack);
            throw new Error('Failed to fetch published quotations.');
        }
    }

    async getAcceptedQuotations(editorId: Types.ObjectId, query: GetAcceptedQuotationsQueryDto): Promise<PaginatedAcceptedQuotationsResponseDto> {
        try {
            const response = await this.quotationRepository.getAcceptedQuotations(editorId, query);
            const totalItems = response.totalItemsResult.length > 0 ? response.totalItemsResult[0].totalItems : 0;
            const quotations: AcceptedQuotationItemDto[] = response.result.map(q => ({
                _id: q._id,
                title: q.title,
                description: q.description,
                estimatedBudget: q.estimatedBudget,
                theme: q.theme,
                outputType: q.outputType,
                dueDate: q.dueDate,
                status: q.status,
                editorId: q.editorId,
                userId: q.userId,
                userFullName: q.userDetails?.fullname,
                imageUrl: q.imageUrl,
                isAdvancePaid: q.isAdvancePaid,
                isFullyPaid: q.isFullyPaid,
                attachedFiles: q.attachedFiles?.map(file => ({
                    url: file.url,
                    fileType: file.fileType,
                    fileName: file.fileName,
                    size: file.size,
                    mimeType: file.mimeType,
                    uploadedAt: file.uploadedAt,
                    uniqueId: file.uniqueId,
                    timestamp: file.timestamp
                })),
                createdAt: q.createdAt,
                updatedAt: q.updatedAt,
            }));
            return {
                quotations,
                totalItems,
                currentPage: Number(query.page) || 1,
                itemsPerPage: Number(query.limit) || 10,
            };
        } catch (error) {
            this.logger.error('Error getting the accepted quotations', error);
            throw new Error('Error getting the accepted quotations');
        }
    }

    async findById(quotationId: Types.ObjectId, options?: QueryOptions): Promise<Quotation | null>{
        return this.quotationRepository.findById(quotationId, options);
    }

    async updateQuotationStatus(quotationId: Types.ObjectId, status: QuotationStatus, worksId: Types.ObjectId, penalty?: number): Promise<Quotation | null>{
        const updateData: any = { status, worksId };
        if (penalty !== undefined) {
            updateData.penalty = penalty;
        }
        const updatedQuotation = await this.quotationRepository.findByIdAndUpdate(quotationId, updateData);
        if (updatedQuotation && status === QuotationStatus.ACCEPTED) {
            await this.timelineService.create({
                quotationId: updatedQuotation._id,
                userId: updatedQuotation.userId,
                editorId: updatedQuotation.editorId,
                event: TimelineEvent.EDITOR_ASSIGNED,
                message: 'Editor accepted the quotation and work has started.',
            });
        }

        return updatedQuotation;
    }

    async getCompletedQuotations(editorId: Types.ObjectId): Promise<CompletedWorkDto[]> {
        const quotations = await this.quotationRepository.find(
            {
                $or: [
                    { editorId },
                    { editorId: new Types.ObjectId(editorId) }
                ],
                status: QuotationStatus.COMPLETED
            },
            null,
            { populate: 'worksId'}
        )
        if(!quotations || quotations.length === 0){
            this.logger.debug('No quotations found for editor');
            return [];
        }
        return this._mapQuotationsToCompletedWorkDtos(quotations);
    }

    async findMany(query: FilterQuery<Quotation>): Promise<Quotation[] | null> {
        return this.quotationRepository.findMany(query);
    }

    async updateQuotation(query: FilterQuery<Quotation>, update: UpdateQuery<Quotation>): Promise<Quotation | null> {
        return this.quotationRepository.findByIdAndUpdate(query._id, update)
    }

    async findOneByRazorpayOrderId(orderId: string): Promise<Quotation | null> {
        return this.quotationRepository.findByRazorpayOrderId(orderId);
    }

    async aggregate(pipeline: PipelineStage[]): Promise<any[]> {
        return this.quotationRepository.aggregate(pipeline);
    }

    async createQuotation(quotation: Partial<Quotation>): Promise<Quotation> {
        const createdQuotation = await this.quotationRepository.create(quotation);

        if(createdQuotation){
            await this.timelineService.create({
                quotationId: createdQuotation._id,
                userId: createdQuotation.userId,
                event: TimelineEvent.QUOTATION_CREATED,
                message: 'Quotation created and published by user.',
            })
        }

        return createdQuotation;
    }

    async findByIdAndUpdate(quotationId: Types.ObjectId, update: UpdateQuery<Quotation>, options?: QueryOptions): Promise<Quotation | null> {
        try {
            return this.quotationRepository.findByIdAndUpdate(quotationId, update, options);
        } catch (error) {
            this.logger.error(`Error updating quotation: ${error.message}`);
            throw error;
        }
    }

    async deleteQuotation(quotationId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            await this.quotationRepository.findByIdAndDelete(quotationId);
            return { success: true, message: 'Quotation deleted successfully' };
        } catch (error) {
            this.logger.error('Error deleting quotation', error);
            throw error;
        }
    }

    async getCompletedQuotationsForUser(userId: Types.ObjectId): Promise<CompletedWorkDto[]> {
        const quotations = await this.quotationRepository.find(
            { userId, status: QuotationStatus.COMPLETED },
            null,
            { populate: 'worksId'}
        );
        if(!quotations){
            this.logger.debug('No quotations found for user');
            return [];
        }
        return this._mapQuotationsToCompletedWorkDtos(quotations);
    }

    private async _mapQuotationsToCompletedWorkDtos(quotations: Quotation[]): Promise<CompletedWorkDto[]> {
        if (!quotations || quotations.length === 0) {
            return [];
        }

        const completedWorksPromises = quotations.map(async (quotation) => {
            const worksData = quotation.worksId as any | null;
            const timelineEvents = await this.timelineService.findByQuotationId(quotation._id);

            const timelineDto = timelineEvents.map(event => ({
                event: event.event,
                message: event.message,
                metadata: event.metadata,
                timestamp: event.timestamp,
            }));

            return {
                quotationId: quotation._id,
                worksId: worksData?._id,
                title: quotation.title,
                description: quotation.description,
                theme: quotation.theme,
                estimatedBudget: quotation.estimatedBudget,
                advanceAmount: quotation.advanceAmount,
                balanceAmount: quotation.balanceAmount,
                dueDate: quotation.dueDate,
                status: quotation.status,
                outputType: quotation.outputType,
                attachedFiles: quotation.attachedFiles as any,
                userId: quotation.userId,
                editorId: quotation.editorId,
                finalFiles: worksData?.finalFiles as any || [],
                comments: worksData?.comments || '',
                isPublic: worksData?.isPublic,
                rating: worksData?.rating,
                feedback: worksData?.feedback,
                isSatisfied: worksData?.isSatisfied,
                createdAt: quotation.createdAt,
                updatedAt: quotation.updatedAt,
                completedAt: worksData?.createdAt,
                penalty: quotation.penalty,
                timeline: timelineDto,
            };
        });

        return Promise.all(completedWorksPromises);
    }

    async findOne(query: FilterQuery<Quotation>): Promise<Quotation | null> {
        return this.quotationRepository.findOne(query);
    }
}
