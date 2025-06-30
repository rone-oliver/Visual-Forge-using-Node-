import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Editor, EditorDocument } from './models/editor.schema';
import { Model, Types } from 'mongoose';
import { OutputType, Quotation, QuotationDocument, QuotationStatus } from 'src/quotation/models/quotation.schema';
import { FileType } from 'src/common/cloudinary/dtos/cloudinary.dto';
import { Works, WorksDocument } from 'src/common/models/works.schema';
import { User, UserDocument } from 'src/users/models/user.schema';
import { NotificationType } from 'src/notification/models/notification.schema';
import { Bid, BidDocument, BidStatus } from 'src/common/bids/models/bids.schema';
import { BidsService } from 'src/common/bids/bids.service';
import { IEditorsService } from './interfaces/editors.service.interface';
import {
    GetPublishedQuotationsQueryDto,
    GetAcceptedQuotationsQueryDto,
    SubmitWorkBodyDto,
    CreateEditorBidBodyDto,
    UpdateEditorBidBodyDto,
    EditorDetailsResponseDto,
    PaginatedAcceptedQuotationsResponseDto,
    FileUploadResultDto,
    BidResponseDto,
    CompletedWorkDto,
    AcceptedQuotationItemDto,
    UserForEditorDetailsDto,
    EditorDetailsDto,
    PaginatedPublishedQuotationsResponseDto,
    PublishedQuotationItemDto,
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

@Injectable()
export class EditorsService implements IEditorsService {
    private readonly logger = new Logger(EditorsService.name);
    constructor(
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @Inject(IEditorRepositoryToken) private readonly editorRepository: IEditorRepository,
        @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
        @InjectModel(Works.name) private workModel: Model<WorksDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
        @Inject(IRelationshipServiceToken) private readonly relationshipService: IRelationshipService,
        @Inject(ICloudinaryServiceToken) private readonly cloudinaryService: ICloudinaryService,
        @Inject(IEditorRequestsRepositoryToken) private readonly editorRequestsRepository: IEditorRequestsRepository,
        private eventEmitter: EventEmitter2,
        private readonly bidsService: BidsService,
    ) { };

    async getEditorRequests(): Promise<EditorRequest[]> {
        return this.editorRequestsRepository.getEditorRequests();
    }

    async approveEditorRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<boolean> {
        try {
            const request = await this.editorRequestsRepository.approveEditorRequest(requestId, adminId);
            if (request && request.userId) {
                await this.userModel.updateOne({ _id: request.userId }, { isEditor: true });
                await this.editorModel.create({ userId: new Types.ObjectId(request.userId), category: [request.categories] });
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

    async createEditor(editor: Partial<Editor>): Promise<Editor> {
        return this.editorModel.create(editor);
    }

    async getPublishedQuotations(
        editorId: Types.ObjectId,
        params: GetPublishedQuotationsQueryDto
    ): Promise<PaginatedPublishedQuotationsResponseDto> {
        const { page = 1, limit = 10, mediaType, searchTerm } = params;
        const skip = (page - 1) * limit;

        const matchStage: any = {
            status: QuotationStatus.PUBLISHED,
            userId: { $ne: editorId },
        };

        if (mediaType && mediaType !== OutputType.MIXED && mediaType !== 'All') {
            matchStage.outputType = mediaType as OutputType;
        }

        const pipeline: any[] = [
            { $match: matchStage },
            {
                $addFields: {
                    convertedUserId: { $toObjectId: '$userId' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'convertedUserId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }
            },
            {
                $addFields: {
                    userFullName: '$userDetails.fullname',
                }
            },
        ];

        // Search stage (only if searchTerm is provided)
        if (searchTerm) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: searchTerm, $options: 'i' } },
                        { description: { $regex: searchTerm, $options: 'i' } },
                        { userFullName: { $regex: searchTerm, $options: 'i' } }
                    ]
                }
            });
        }

        // Lookup for editor's bid
        pipeline.push(
            {
                $lookup: {
                    from: 'bids',
                    let: { quotation_id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$quotationId', '$$quotation_id'] },
                                        { $eq: ['$editorId', new Types.ObjectId(editorId)] } // Ensure editorId is a Types.ObjectId
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        {
                            $project: {
                                _id: 0,
                                bidId: '$_id',
                                bidAmount: '$bidAmount',
                                bidStatus: '$status',
                                bidNotes: '$notes',
                                bidCreatedAt: '$createdAt'
                            }
                        }
                    ],
                    as: 'editorBidDetails'
                }
            },
            {
                $addFields: {
                    editorBid: { $arrayElemAt: ['$editorBidDetails', 0] }
                }
            }
        );

        // Facet for pagination and total count
        pipeline.push({
            $facet: {
                paginatedResults: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        });

        try {
            const results = await this.quotationModel.aggregate(pipeline).exec();

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
                currentPage: page,
                itemsPerPage: limit,
            };
        } catch (error) {
            this.logger.error(`Error fetching published quotations for editor ${editorId}: ${error.message}`, error.stack);
            throw new Error('Failed to fetch published quotations.');
        }
    }

    async getAcceptedQuotations(
        editorId: Types.ObjectId,
        params: GetAcceptedQuotationsQueryDto
    ): Promise<PaginatedAcceptedQuotationsResponseDto> {
        const { page = 1, limit = 10, searchTerm } = params;
        const skip = (page - 1) * limit;

        const matchStage: any = {
            status: QuotationStatus.ACCEPTED,
            $or: [
                { editorId },
                { editorId: new Types.ObjectId(editorId) }
            ],
        };

        if (searchTerm) {
            matchStage.$and = [
                { $or: matchStage.$or },
                {
                    $or: [
                        { title: { $regex: searchTerm, $options: 'i' } },
                        { description: { $regex: searchTerm, $options: 'i' } },
                    ]
                }
            ];
            delete matchStage.$or;
        }

        const countPipeline = [
            {
                $match: matchStage
            },
            {
                $count: 'totalItems'
            }
        ]

        const dataPipeline: any[] = [
            { $match: matchStage },
            { $sort: { dueDate: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $addFields: {
                    convertedUserId: { $toObjectId: '$userId' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'convertedUserId',
                    foreignField: '_id',
                    as: 'clientDetails',
                },
            },
            {
                $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true },
            },
            {
                $addFields: {
                    userFullName: '$clientDetails.fullname',
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    estimatedBudget: 1,
                    theme: 1,
                    outputType: 1,
                    dueDate: 1,
                    status: 1,
                    isAdvancePaid: 1,
                    isFullyPaid: 1,
                    userId: 1,
                    editorId: 1,
                    userFullName: 1,
                    imageUrl: 1,
                    attachedFiles: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]

        try {
            const totalItemsResult = await this.quotationModel.aggregate(countPipeline).exec();
            const totalItems = totalItemsResult.length > 0 ? totalItemsResult[0].totalItems : 0;
            const result = await this.quotationModel.aggregate(dataPipeline).exec();

            const paginatedResults = result;
            const quotations: AcceptedQuotationItemDto[] = paginatedResults.map(q => ({
                _id: q._id,
                title: q.title,
                description: q.description,
                estimatedBudget: q.estimatedBudget,
                theme: q.theme,
                outputType: q.outputType,
                dueDate: q.dueDate,
                status: q.status,
                editorId: q.editorId,
                userId: q.userId, // Client's ID
                userFullName: q.userDetails?.fullname, // Client's full name
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
                })),
                createdAt: q.createdAt,
                updatedAt: q.updatedAt,
            }));

            return {
                quotations,
                totalItems,
                currentPage: Number(page) || 1,
                itemsPerPage: Number(limit) || 10,
            };
        } catch (error) {
            this.logger.error('Error getting the accepted quotations', error);
            throw new Error('Error getting the accepted quotations');
        }
    }

    async uploadWorkFiles(files: Express.Multer.File[], folder?: string): Promise<FileUploadResultDto[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded.');
        }
        const uploadResults = await this.cloudinaryService.uploadFiles(files, folder);
        return uploadResults.map(result => ({
            url: result.url,
            fileType: result.fileType as FileType, // Assuming FileType enum matches
            fileName: result.fileName,
            size: result.size,
            mimeType: result.mimeType,
            uploadedAt: result.uploadedAt,
        }));
    }

    async submitQuotationResponse(
        editorId: Types.ObjectId, 
        workData: SubmitWorkBodyDto) {
        try {
            const { quotationId, finalFiles, comments } = workData;
            const quotation = await this.quotationModel.findById(new Types.ObjectId(quotationId));
        if (!quotation) {
            this.logger.warn(`Quotation with ID ${quotationId} not found`);
            return false;
        }
            const work = await this.workModel.create({
                editorId: quotation.editorId,
                userId: quotation.userId,
                finalFiles,
                comments,
        });
        await this.quotationModel.findByIdAndUpdate(quotation._id, { status: QuotationStatus.COMPLETED, worksId: work._id });

        this.eventEmitter.emit(EventTypes.QUOTATION_COMPLETED,{
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
            const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) }).lean();
            if (!editor) {
                this.logger.warn(`Editor with ID ${editorId} not found or not an editor`);
                return;
            }

            // Get the editor's most recent completed works
            const recentWorks = await this.workModel
                .find({ editorId })
                .sort({ createdAt: -1 })
                .limit(2)
                .lean();

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
            await this.editorModel.findOneAndUpdate({ userId: new Types.ObjectId(editorId) }, {
                score: newScore,
                streak: currentStreak
            });

            this.logger.log(`Updated editor ${editorId} score to ${newScore} (streak: ${currentStreak}, multiplier: ${streakMultiplier})`);
        } catch (error) {
            this.logger.error('Error updating editor score', error);
            // Don't throw error to prevent disrupting the main workflow
        }
    }

    async getCompletedWorks(editorId: Types.ObjectId): Promise<CompletedWorkDto[]> {
        try {
            const completedQuotations = await this.quotationModel
                .find({
                    $or: [
                        { editorId },
                        { editorId: new Types.ObjectId(editorId) }
                    ],
                    status: QuotationStatus.COMPLETED 
                })
                .populate('worksId')
                .sort({ createdAt: -1 })
                .lean();

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
                        url: f.url,
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

    private calculateAverageRating(ratings: any[] | undefined): number {
        if (!ratings || ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    async getEditor(editorId: string): Promise<EditorDetailsResponseDto | null> {
        try {
            const user = await this.userModel.findById(new Types.ObjectId(editorId));
            if (user && user.isEditor) {
                this.logger.log('Fetching the editor details');
                const editorDetailsDoc = await this.editorModel.findOne({ userId: user._id }).lean();
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
                        averageRating: this.calculateAverageRating(editorDetailsDoc.ratings),
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
        const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) });

        if (!editor) {
            throw new NotFoundException(`Editor with user ID ${editorId} not found.`);
        }

        if(editor.sharedTutorials){
            editor.sharedTutorials.push(addTutorialDto.tutorialUrl);
        }

        return await editor.save();
    }

    async removeTutorial(editorId: string, removeTutorialDto: RemoveTutorialDto): Promise<Editor> {
        const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) });
        if (!editor) {
            throw new NotFoundException(`Editor with user ID ${editorId} not found.`);
        }
    
        if (editor.sharedTutorials) {
            editor.sharedTutorials = editor.sharedTutorials.filter(
                (url) => url !== removeTutorialDto.tutorialUrl
            );
        }

        return await editor.save();
    }
}
