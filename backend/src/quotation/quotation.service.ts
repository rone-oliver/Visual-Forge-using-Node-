import { Inject, Injectable, Logger } from '@nestjs/common';
import { IQuotationService } from './interfaces/quotation.service.interface';
import { IQuotationRepository, IQuotationRepositoryToken } from './interfaces/quotation.repository.interface';
import { Quotation, QuotationDocument, QuotationStatus } from './models/quotation.schema';
import { AcceptedQuotationItemDto, CompletedWorkDto, GetAcceptedQuotationsQueryDto, GetPublishedQuotationsQueryDto, getQuotationsByStatusResponseDto, PaginatedAcceptedQuotationsResponseDto, PaginatedPublishedQuotationsResponseDto, PublishedQuotationItemDto } from './dtos/quotation.dto';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { WorksDocument } from 'src/works/models/works.schema';

@Injectable()
export class QuotationService implements IQuotationService {
    private readonly logger = new Logger(QuotationService.name);
    constructor(
        @Inject(IQuotationRepositoryToken) private readonly quotationRepository: IQuotationRepository,
    ) { }

    async countAllQuotations(): Promise<number> {
        return this.quotationRepository.countDocuments();
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

    async findById(quotationId: Types.ObjectId): Promise<Quotation | null>{
        return this.quotationRepository.findById(quotationId);
    }

    async updateQuotationStatus(quotationId: Types.ObjectId, status: QuotationStatus, worksId: Types.ObjectId): Promise<Quotation | null>{
        return this.quotationRepository.findByIdAndUpdate(quotationId, { status, worksId });
    }

    async getCompletedQuotations(editorId: Types.ObjectId): Promise<CompletedWorkDto[]> {
        try {
            const completedQuotations = await this.quotationRepository.getCompletedQuotations(editorId);
            return completedQuotations.map(quotation => {
                const worksData = quotation.worksId as unknown as WorksDocument;
                const qData = quotation as unknown as QuotationDocument;
    
                const completedWork: CompletedWorkDto = {
                    quotationId: qData._id,
                    worksId: worksData?._id,
                    title: qData.title,
                    description: qData.description,
                    theme: qData.theme,
                    estimatedBudget: qData.estimatedBudget,
                    advanceAmount: qData.advanceAmount,
                    dueDate: qData.dueDate,
                    status: qData.status,
                    outputType: qData.outputType,
                    attachedFiles: qData.attachedFiles?.map(f => ({
                        url: f.url ? f.url : '',
                        fileType: f.fileType,
                        fileName: f.fileName,
                        size: f.size,
                        mimeType: f.mimeType,
                        uploadedAt: f.uploadedAt,
                    })),
                    userId: qData.userId, // Client's ID
                    editorId: qData.editorId, // Editor's ID
                    finalFiles: worksData?.finalFiles?.map(f => ({
                        url: f.url,
                        fileType: f.fileType,
                        fileName: f.fileName,
                        size: f.size,
                        mimeType: f.mimeType,
                        uploadedAt: f.uploadedAt,
                        uniqueId: f.uniqueId,
                        timestamp: f.timestamp
                    })) || [],
                    comments: worksData?.comments || '',
                    isPublic: worksData?.isPublic, // from Works schema if exists
                    rating: worksData?.rating, // from Works schema if exists
                    feedback: worksData?.feedback, // from Works schema if exists
                    createdAt: qData.createdAt, // Quotation creation
                    updatedAt: qData.updatedAt, // Quotation update
                    completedAt: worksData?.createdAt, // Work submission time
                };
                return completedWork;
            })
        } catch (error) {
            this.logger.error('Error getting the completed works', error);
            throw new Error('Error getting the completed works');
        }
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
}
