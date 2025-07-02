import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Editor } from './models/editor.schema';
import { Types } from 'mongoose';
import { QuotationStatus } from 'src/quotation/models/quotation.schema';
import { FileType } from 'src/common/cloudinary/dtos/cloudinary.dto';
import { NotificationType } from 'src/notification/models/notification.schema';
import { BidStatus } from 'src/common/bids/models/bids.schema';
import { IEditorsService } from './interfaces/editors.service.interface';
import {
    SubmitWorkBodyDto,
    CreateEditorBidBodyDto,
    UpdateEditorBidBodyDto,
    EditorDetailsResponseDto,
    FileUploadResultDto,
    BidResponseDto,
    UserForEditorDetailsDto,
    EditorDetailsDto,
    AddTutorialDto,
    RemoveTutorialDto,
} from './dto/editors.dto';
import { CreateBidDto } from 'src/common/bids/dto/create-bid.dto';
import { IRelationshipService, IRelationshipServiceToken } from 'src/common/relationship/interfaces/service.interface';
import { EventTypes } from 'src/common/constants/events.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ICloudinaryService, ICloudinaryServiceToken } from 'src/common/cloudinary/interfaces/cloudinary-service.interface';
import { EditorRequest } from 'src/editors/models/editorRequest.schema';
import { IEditorRequestsRepository, IEditorRequestsRepositoryToken } from './interfaces/editorRequests.repository.interface';
import { FormattedEditor, GetEditorsQueryDto } from 'src/admins/dto/admin.dto';
import { IEditorRepository, IEditorRepositoryToken } from './interfaces/editor.repository.interface';
import { IBidService, IBidServiceToken } from 'src/common/bids/interfaces/bid.interfaces';
import { IQuotationService, IQuotationServiceToken } from 'src/quotation/interfaces/quotation.service.interface';
import { CompletedWorkDto, FileAttachmentDto, GetAcceptedQuotationsQueryDto, GetPublishedQuotationsQueryDto, PaginatedAcceptedQuotationsResponseDto, PaginatedPublishedQuotationsResponseDto } from 'src/quotation/dtos/quotation.dto';
import { IWorkService, IWorkServiceToken } from 'src/works/interfaces/works.service.interface';
import { IUsersService, IUsersServiceToken } from 'src/users/interfaces/users.service.interface';
import { calculateAverageRating } from 'src/common/utils/calculation.util';

@Injectable()
export class EditorsService implements IEditorsService {
    private readonly logger = new Logger(EditorsService.name);
    constructor(
        @Inject(IEditorRepositoryToken) private readonly editorRepository: IEditorRepository,
        @Inject(IQuotationServiceToken) private readonly quotationService: IQuotationService,
        @Inject(IWorkServiceToken) private readonly worksService: IWorkService,
        @Inject(IUsersServiceToken) private readonly userService: IUsersService,
        @Inject(IRelationshipServiceToken) private readonly relationshipService: IRelationshipService,
        @Inject(ICloudinaryServiceToken) private readonly cloudinaryService: ICloudinaryService,
        @Inject(IEditorRequestsRepositoryToken) private readonly editorRequestsRepository: IEditorRequestsRepository,
        @Inject(IBidServiceToken) private readonly bidsService: IBidService,
        private eventEmitter: EventEmitter2,
    ) { };

    async getEditorRequests(): Promise<EditorRequest[]> {
        return this.editorRequestsRepository.getEditorRequests();
    }

    async approveEditorRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<boolean> {
        try {
            const request = await this.editorRequestsRepository.approveEditorRequest(requestId, adminId);
            if (request && request.userId) {
                await this.userService.makeUserEditor(request.userId);
                await this.editorRepository.create({ userId: new Types.ObjectId(request.userId), category: [request.categories] });
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error approving request: ${error.message}`);
            throw new HttpException('Failed to approve request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async rejectEditorRequest(requestId: Types.ObjectId, reason: string): Promise<boolean> {
        try {
            const request = await this.editorRequestsRepository.rejectEditorRequest(requestId, reason);
            return request !== null;
        } catch (error) {
            this.logger.error(`Error rejecting request: ${error.message}`);
            throw new HttpException('Failed to reject request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async countEditorRequests(): Promise<number> {
        return this.editorRequestsRepository.countEditorRequests();
    }

    async getEditorsForAdmin(query: GetEditorsQueryDto): Promise<FormattedEditor[]> {
        try {
            this.logger.log('Fetching editor with these query:', query);

            const pipeline: any[] = [];

            const matchStage: any = {};

            const categoryFilters: string[] = [];
            if (query.video === 'true') categoryFilters.push('Video');
            if (query.image === 'true') categoryFilters.push('Image');
            if (query.audio === 'true') categoryFilters.push('Audio');

            if (categoryFilters.length > 0) {
                matchStage['category'] = { $all: categoryFilters };
            }

            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage });
            }

            pipeline.push({
                $addFields: {
                    averageRating: {
                        $cond: {
                            if: { $eq: [{ $size: "$ratings" }, 0] },
                            then: 0,
                            else: { $avg: "$ratings.rating" }
                        }
                    }
                }
            });

            if (query.rating) {
                pipeline.push({
                    $match: {
                        averageRating: { $gte: parseFloat(query.rating) }
                    }
                });
            }

            pipeline.push({
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            });

            pipeline.push({ $unwind: '$userInfo' });

            if (query.search) {
                pipeline.push({
                    $match: {
                        'userInfo.username': { $regex: query.search, $options: 'i' }
                    }
                });
            }

            pipeline.push({
                $project: {
                    _id: 1,
                    userId: '$userInfo._id',
                    fullname: '$userInfo.fullname',
                    username: '$userInfo.username',
                    email: '$userInfo.email',
                    profileImage: '$userInfo.profileImage',
                    category: { $ifNull: ['$category', []] },
                    score: { $ifNull: ['$score', 0] },
                    ratingsCount: { $size: '$ratings' },
                    averageRating: 1,
                    createdAt: 1,
                    isVerified: '$userInfo.isVerified',
                    isBlocked: '$userInfo.isBlocked',
                    socialLinks: { $ifNull: ['$socialLinks', {}] }
                }
            });

            const editors = await this.editorRepository.aggregate(pipeline);
            return editors as unknown as FormattedEditor[];
        } catch (error) {
            this.logger.error(`Error fetching editors: ${error.message}`);
            throw new HttpException('No editors found', HttpStatus.NOT_FOUND);
        }
    }

    async countAllEditors(): Promise<number> {
        return this.editorRepository.countDocuments();
    }

    async getPublishedQuotations(
        editorId: Types.ObjectId,
        params: GetPublishedQuotationsQueryDto
    ): Promise<PaginatedPublishedQuotationsResponseDto> {
        return this.quotationService.getPublishedQuotations(editorId, params);
    }

    async getAcceptedQuotations(
        editorId: Types.ObjectId,
        params: GetAcceptedQuotationsQueryDto
    ): Promise<PaginatedAcceptedQuotationsResponseDto> {
        return this.quotationService.getAcceptedQuotations(editorId, params);
    }

    async uploadWorkFiles(files: Express.Multer.File[], folder?: string): Promise<Omit<FileAttachmentDto,'url'>[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded.');
        }
        const uploadResults = await this.cloudinaryService.uploadFiles(files, folder);
        return uploadResults.map(result => ({
            // url: result.url,
            fileType: result.fileType as FileType, // Assuming FileType enum matches
            fileName: result.fileName,
            size: result.size,
            mimeType: result.mimeType,
            uploadedAt: result.uploadedAt,
            uniqueId: result.uniqueId,
            timestamp: result.timestamp,
            format: result.format,
        }));
    }

    async submitQuotationResponse(workData: SubmitWorkBodyDto) {
        try {
            const { quotationId, finalFiles, comments } = workData;
            const quotation = await this.quotationService.findById(new Types.ObjectId(quotationId));
            if (!quotation) {
                this.logger.warn(`Quotation with ID ${quotationId} not found`);
                return false;
            }
            const work = await this.worksService.createWork({
                editorId: quotation.editorId,
                userId: quotation.userId,
                finalFiles: finalFiles.map(file => {
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
            });
            await this.quotationService.updateQuotationStatus(quotation._id, QuotationStatus.COMPLETED, work._id);

            this.eventEmitter.emit(EventTypes.QUOTATION_COMPLETED, {
                userId: quotation.userId,
                type: NotificationType.WORK,
                message: `Your work "${quotation.title}" has been completed`,
                data: { title: quotation.title },
                quotationId: quotation._id,
                worksId: work._id
            })

            await this.updateEditorScore(quotation.editorId);
            return true;
        } catch (error) {
            this.logger.error('Error submitting the quotation response', error);
            throw new Error('Error submitting the quotation response');
        }
    }

    private async updateEditorScore(editorId: Types.ObjectId): Promise<void> {
        try {
            // Get the editor's profile
            const editor = await this.editorRepository.findByUserId(editorId);
            if (!editor) {
                this.logger.warn(`Editor with ID ${editorId} not found or not an editor`);
                return;
            }

            // Get the editor's most recent completed works
            const recentWorks = await this.worksService.getTwoRecentWorks(editorId);

            // Initialize score variables
            let scoreIncrement = 10; // Base score for completing a work
            let currentStreak = editor.streak || 0;
            let streakMultiplier = 1;

            // If this is not their first work
            if (recentWorks.length > 1) {
                const latestWork = recentWorks[0];
                const previousWork = recentWorks[1];

                // Calculate time difference in days
                const latestDate = new Date(latestWork.createdAt);
                const previousDate = new Date(previousWork.createdAt);
                const daysDifference = Math.floor((latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

                // If completed within a week, increase streak
                if (daysDifference < 7) {
                    currentStreak++;
                    // Increase multiplier based on streak length
                    streakMultiplier = Math.min(3, 1 + (currentStreak * 0.1)); // Cap at 3x
                } else {
                    // Streak broken
                    currentStreak = 1;
                    streakMultiplier = 1;
                }
            } else {
                // First work
                currentStreak = 1;
            }

            // Calculate final score
            const finalScoreIncrement = Math.round(scoreIncrement * streakMultiplier);
            const newScore = (editor.score || 0) + finalScoreIncrement;

            // Update editor profile
            await this.editorRepository.updateScore(editor._id, newScore, currentStreak);

            this.logger.log(`Updated editor ${editorId} score to ${newScore} (streak: ${currentStreak}, multiplier: ${streakMultiplier})`);
        } catch (error) {
            this.logger.error('Error updating editor score', error);
        }
    }

    async getCompletedWorks(editorId: Types.ObjectId): Promise<CompletedWorkDto[]> {
        return this.quotationService.getCompletedQuotations(editorId);
    }

    async getEditor(editorId: string): Promise<EditorDetailsResponseDto | null> {
        try {
            const user = await this.userService.getUserById(new Types.ObjectId(editorId));
            if (user && user.isEditor) {
                this.logger.log('Fetching the editor details');
                const editorDetailsDoc = await this.editorRepository.findByUserIdAndLean(user._id);

                if (editorDetailsDoc) {
                    this.logger.log('Editor details: ', editorDetailsDoc)
                    const [followersCount, followingCount] = await Promise.all([
                        this.relationshipService.getFollowerCount(user._id),
                        this.relationshipService.getFollowingCount(user._id),
                    ]);
                    const userDto: UserForEditorDetailsDto = {
                        _id: user._id,
                        fullname: user.fullname,
                        username: user.username,
                        email: user.email,
                        profileImage: user.profileImage,
                        isEditor: user.isEditor,
                    };

                    const editorDto: EditorDetailsDto = {
                        category: editorDetailsDoc.category || [],
                        score: editorDetailsDoc.score || 0,
                        ratingsCount: editorDetailsDoc.ratings?.length || 0,
                        averageRating: calculateAverageRating(editorDetailsDoc.ratings),
                        socialLinks: editorDetailsDoc.socialLinks || {},
                        createdAt: editorDetailsDoc.createdAt,
                        followersCount,
                        followingCount,
                    };

                    return { ...userDto, editorDetails: editorDto };
                } else {
                    this.logger.warn(`No editor sub-document found for user ID: ${user._id}`);
                    // Still return user details if they are an editor, but editorDetails might be minimal or absent
                    const userDto: UserForEditorDetailsDto = {
                        _id: user._id,
                        fullname: user.fullname,
                        username: user.username,
                        email: user.email,
                        profileImage: user.profileImage,
                        isEditor: user.isEditor,
                    };
                    return { ...userDto, editorDetails: undefined };
                }
            }
            return null;
        } catch (error) {
            this.logger.error('Error getting the editor', error);
            throw new Error('Error getting the editor');
        }
    }

    async createBid(
        editorId: Types.ObjectId,
        bidDto: CreateEditorBidBodyDto
    ): Promise<BidResponseDto> {
        const { quotationId, bidAmount, notes } = bidDto;
        const bidData = {
            quotationId: new Types.ObjectId(quotationId),
            bidAmount,
            notes,
            status: BidStatus.PENDING
        } as unknown as CreateBidDto;

        return await this.bidsService.create(bidData, editorId);
    }

    async updateBid(
        bidId: Types.ObjectId,
        editorId: Types.ObjectId,
        bidDto: UpdateEditorBidBodyDto
    ): Promise<BidResponseDto> {
        const { bidAmount, notes } = bidDto;
        const updatedBid = await this.bidsService.updateBid(bidId, editorId, bidAmount, notes);
        return {
            _id: updatedBid._id,
            quotationId: updatedBid.quotationId,
            editorId: updatedBid.editorId,
            bidAmount: updatedBid.bidAmount,
            notes: updatedBid.notes,
            status: updatedBid.status,
            createdAt: updatedBid.createdAt,
            updatedAt: updatedBid.updatedAt,
        };
    }

    async deleteBid(bidId: Types.ObjectId, editorId: Types.ObjectId): Promise<void> {
        return this.bidsService.deleteBid(bidId, editorId);
    }

    async addTutorial(editorId: string, addTutorialDto: AddTutorialDto): Promise<Editor> {
        return this.editorRepository.addSharedTutorial(editorId, addTutorialDto.tutorialUrl);
    }

    async removeTutorial(editorId: string, removeTutorialDto: RemoveTutorialDto): Promise<Editor> {
        return this.editorRepository.removeSharedTutorial(editorId, removeTutorialDto.tutorialUrl);
    }
}