import { Injectable, Logger, HttpException, HttpStatus, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './models/user.schema';
import { Editor, EditorDocument } from 'src/editors/models/editor.schema';
import { EditorRequest, EditorRequestDocument } from 'src/common/models/editorRequest.schema';
import { Quotation, QuotationDocument, QuotationStatus } from 'src/common/models/quotation.schema';
import { Works, WorksDocument } from 'src/common/models/works.schema';
import { PaymentStatus, PaymentType, Transaction, TransactionDocument } from 'src/common/models/transaction.schema';
import { Bid, BidDocument } from 'src/common/bids/models/bids.schema';
import { CloudinaryService, FileUploadResult } from 'src/common/cloudinary/cloudinary.service';
import { NotificationService } from 'src/notification/notification.service';
import { BidsService } from 'src/common/bids/bids.service';
import { IUsersService, UserInfoForChatListDto } from './interfaces/users.service.interface';
import {
    CreateQuotationDto,
    UpdateQuotationDto,
    GetQuotationsParamsDto,
    PaginatedQuotationsResponseDto,
    QuotationWithBidCountDto,
    UserBaseResponseDto,
    UserProfileResponseDto,
    UserBasicInfoDto,
    SuccessResponseDto,
    EditorRequestStatusResponseDto,
    QuotationResponseDto,
    FileUploadResultDto,
    UpdateProfileDto,
    ResetPasswordDto,
    CompletedWorkDto,
    RateWorkDto,
    RateEditorDto,
    EditorRatingResponseDto,
    UpdateWorkPublicStatusDto,
    PaginatedPublicWorksResponseDto,
    GetPublicWorksQueryDto,
    TransactionResponseDto,
    UserRatingForEditorDto,
    PublicWorkItemDto,
    BidResponseDto,
    PaginatedTransactionsResponseDto,
    EditorPublicProfileResponseDto,
    GetPublicEditorsDto,
    PaginatedPublicEditorsDto
} from './dto/users.dto';
import { NotificationType } from 'src/notification/models/notification.schema';

@Injectable()
export class UsersService implements IUsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(EditorRequest.name) private editorRequestModel: Model<EditorRequestDocument>,
        @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
        @InjectModel(Works.name) private workModel: Model<WorksDocument>,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
        private cloudinaryService: CloudinaryService,
        private notificationService: NotificationService,
        private bidsService: BidsService,
    ) { }

    async findOne(filter: Partial<User>): Promise<User | null> {
        try {
            return this.userModel.findOne(filter).exec();
        } catch (error) {
            this.logger.error(`Error finding user: ${error.message}`);
            // throw error;
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    }

    async findByUsername(username: string) {
        return await this.userModel.findOne({ username });
    }

    async findByEmail(email: string) {
        return await this.userModel.findOne({ email });
    }

    async createUser(user: Partial<User>): Promise<User> {
        try {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            this.logger.log(`Creating new user: ${user.email}`);
            return this.userModel.create(user);
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    private async generateUniqueUsername(): Promise<string> {
        let isUnique = false;
        let username = '';

        while (!isUnique) {
            const randomString = Math.random().toString(36).substring(2, 6);
            username = `user_${randomString}`;

            const existingUser = await this.userModel.findOne({ username });
            if (!existingUser) {
                isUnique = true;
            }
        }
        return username;
    }

    async createGoogleUser(user: Partial<User>): Promise<User> {
        try {
            if (!user.username) {
                user.username = await this.generateUniqueUsername();
            }
            user.isVerified = true;
            return this.createUser(user);
        } catch (error) {
            this.logger.error(`Failed to create Google user: ${error.message}`);
            throw error;
        }
    }

    async updateUserGoogleId(userId: Types.ObjectId, googleId: string): Promise<User | null> {
        try {
            return await this.userModel.findOneAndUpdate({ _id: userId }, { $set: { googleId } }, { new: true })
        } catch (error) {
            this.logger.error(`Error updating user: ${error.message}`);
            throw error;
        }
    }

    async updateOne(filter: Partial<User>, update: Partial<User>) {
        try {
            await this.userModel.updateOne(filter, update);
            this.logger.log("User data updated successfully");
        } catch (error) {
            this.logger.error(`Error updating User: ${error.message}`);
            throw error;
        }
    }

    async updatePassword(userId: Types.ObjectId, password: string): Promise<boolean> {
        try {
            this.logger.log(userId, password)
            await this.userModel.updateOne({ _id: userId }, { $set: { password } });
            this.logger.log("Password updated successfully");
            return true;
        } catch (error) {
            this.logger.error(`Error updating password: ${error.message}`);
            throw error;
        }
    }

    async getUserDetails(userId: Types.ObjectId): Promise<UserProfileResponseDto | null> {
        try {
            this.logger.log(`Fetching user details for ID: ${userId}`);
            const user = await this.userModel.findById(userId);
            if (user && user.isEditor) {
                this.logger.log('Fetching the editor details');
                console.log('user id: ', user._id);
                const editorDetails = await this.editorModel.findOne({ userId: user._id }).lean();
                if (editorDetails) {
                    this.logger.log('Editor details: ', editorDetails)
                    const userObj = user.toObject();
                    return {
                        ...userObj,
                        editorDetails: {
                            category: editorDetails.category || [],
                            score: editorDetails.score || 0,
                            ratingsCount: editorDetails.ratings?.length || 0,
                            averageRating: this.calculateAverageRating(editorDetails.ratings),
                            socialLinks: editorDetails.socialLinks || {},
                            createdAt: editorDetails.createdAt,
                        }
                    }
                } else console.log('no editor details');
            }
            return user;
        } catch (error) {
            this.logger.error(`Error fetching user details: ${error.message}`);
            throw error;
        }
    }

    async getUsers(currentUserId: Types.ObjectId): Promise<UserBasicInfoDto[]> {
        try {
            return await this.userModel.find({ _id: { $ne: currentUserId } });
        } catch (error) {
            this.logger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }

    async getUserInfoForChatList(userId: Types.ObjectId): Promise<UserInfoForChatListDto> {
        try {
            const userInfo = await this.userModel.findById(userId, { username: 1, profileImage: 1, isOnline: 1 });
            if(!userInfo){
                throw new NotFoundException('No user info found for your chats');
            }
            return userInfo;
        } catch (error) {
            this.logger.error(`Error fetching user info for chat list: ${error.message}`);
            throw error;
        }
    }

    private calculateAverageRating(ratings: any[] | undefined): number {
        if (!ratings || ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    async requestForEditor(userId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {

            const user = await this.userModel.findById(userId).select('isEditor');
            if (user && !user.isEditor) {
                this.logger.log(`User ${userId} is not an editor. Proceeding with request.`);
                await this.editorRequestModel.create({ userId });
                this.logger.log(`Editor request created for user ${userId}`);
                return { success: true };
            }
            this.logger.log(`User ${userId} is already an editor or not found`);
            return { success: false };
        } catch (error) {
            this.logger.error(`Error requesting editor role: ${error.message}`);
            return { success: false };
        }
    }

    async getEditorRequestStatus(userId: Types.ObjectId): Promise<EditorRequestStatusResponseDto> {
        try {
            const request = await this.editorRequestModel.findOne({ userId });
            if (request) {
                this.logger.log(`Editor request status for user ${userId}: ${request.status}`);
                return { status: request.status };
            }
            return { status: null };
        } catch (error) {
            this.logger.error(`Error fetching editor request status: ${error.message}`);
            throw error;
        }
    }

    async getTransactionHistory(userId: Types.ObjectId, params: { page: number, limit: number }): Promise<PaginatedTransactionsResponseDto> {
        const { page, limit } = params;
        const skip = (page - 1) * limit;

        try {
            this.logger.log(`Fetching transaction history for user ${userId}, page: ${page}, limit: ${limit}`);

            const transactionsQuery = this.transactionModel.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'quotationId',
                    select: 'title',
                })
                .lean()
                .exec();

            const totalItemsQuery = this.transactionModel.countDocuments({ userId }).exec();

            const [transactions, totalItems] = await Promise.all([transactionsQuery, totalItemsQuery]);

            const totalPages = Math.ceil(totalItems / limit);

            return {
                transactions: transactions as any,
                totalItems,
                totalPages,
                currentPage: page,
                limit,
            };
        } catch (error) {
            this.logger.error(`Error fetching transaction history for user ${userId}: ${error.message}`);
            throw new InternalServerErrorException('Failed to fetch transaction history.');
        }
    }

    async getQuotations(userId: Types.ObjectId, params: GetQuotationsParamsDto): Promise<PaginatedQuotationsResponseDto> {
        try {
            const page = params.page || 1;
            const limit = params.limit || 10;
            const skip = (page - 1) * limit;
            const matchQuery: any = { userId };

            if (params.status && params.status !== 'All') {
                matchQuery.status = params.status;
            }
            if (params.searchTerm) {
                const searchRegex = { $regex: params.searchTerm, $options: 'i' };
                matchQuery.$or = [
                    { title: searchRegex },
                    { description: searchRegex },
                ]
            }

            const totalItems = await this.quotationModel.countDocuments(matchQuery);
            const totalPages = Math.ceil(totalItems / limit);

            const aggregationPipeline: any[] = [
                { $match: matchQuery },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'bids',
                        localField: '_id',
                        foreignField: 'quotationId',
                        as: 'bidsInfo',
                    },
                },
                {
                    $lookup: {
                        from: 'editors',
                        let: { editorIdFromQuotation: '$editorId' }, 
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$userId', '$$editorIdFromQuotation'] } 
                                }
                            },
                            {
                                $project: {
                                    userId: 1, 
                                    _id: 0    
                                }
                            }
                        ],
                        as: 'editorInfo',
                    },
                },
                { $unwind: { path: '$editorInfo', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'users',
                        let: { userIdFromEditor: '$editorInfo.userId' }, 
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$userIdFromEditor'] } 
                                }
                            },
                            {
                                $project: {
                                    fullname: 1,
                                    _id: 0 
                                }
                            }
                        ],
                        as: 'userInfo',
                    },
                },
                { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        bidCount: { $size: '$bidsInfo' },
                        editor: {
                            $cond: {
                                if: { $ifNull: ['$userInfo.fullname', false] },
                                then: '$userInfo.fullname',
                                else: null
                            }
                        },
                    },
                },
                {
                    $project: {
                        bidsInfo: 0,
                        editorInfo: 0, 
                        userInfo: 0    
                    },
                },
                { $skip: skip },
                { $limit: limit },
            ]

            const quotations = await this.quotationModel.aggregate(aggregationPipeline).exec();
            this.logger.log(`quotations from getQuotations for user: `,quotations)
            
            return {
                quotations: quotations as QuotationWithBidCountDto[],
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        } catch (error) {
            this.logger.error(`Error fetching quotations: ${error}`);
            throw error;
        }
    }

    private calculateQuotationAmounts(estimatedBudget: number): { advanceAmount: number, balanceAmount: number } {
        const advancePercentage = 0.4;
        const advanceAmount = Math.round(estimatedBudget * advancePercentage);
        const balanceAmount = estimatedBudget - advanceAmount;
        return { advanceAmount, balanceAmount };
    }

    async createQuotation(userId: Types.ObjectId, createQuotationDto: CreateQuotationDto): Promise<QuotationResponseDto> {
        try {
            this.logger.log(createQuotationDto);
            let calculatedAdvanceAmount: number | undefined;
            let calculatedBalanceAmount: number | undefined;

            if (!createQuotationDto.dueDate) throw new Error('Due date is required');
            if (createQuotationDto.estimatedBudget) {
                const { advanceAmount, balanceAmount } = this.calculateQuotationAmounts(createQuotationDto.estimatedBudget);
                calculatedAdvanceAmount = advanceAmount;
                calculatedBalanceAmount = balanceAmount;
            }
            const quotationDataForDb = {
                ...createQuotationDto,
                userId,
                advanceAmount: calculatedAdvanceAmount,
                balanceAmount: calculatedBalanceAmount,
            }
            const savedQuotation = await this.quotationModel.create(quotationDataForDb);
            await this.notificationService.createNotification({
                userId,
                type: NotificationType.WORK,
                message: 'New quotation created',
                data: { title: savedQuotation.title },
                quotationId: savedQuotation._id
            });
            return savedQuotation as unknown as QuotationResponseDto;
        } catch (error) {
            this.logger.error(`Error creating quotation: ${error.message}`);
            throw error;
        }
    }

    async getQuotation(quotationId: Types.ObjectId): Promise<QuotationResponseDto | null> {
        try {
            const quotation = await this.quotationModel.findById(quotationId) as QuotationResponseDto;
            return quotation;
        } catch (error) {
            this.logger.error(`Error fetching quotation: ${error.message}`);
            throw error;
        }
    }

    async updateQuotation(quotationId: Types.ObjectId, quotation: UpdateQuotationDto): Promise<QuotationResponseDto | null> {
        try {
            let advanceAmountCalc: number | undefined;
            let balanceAmountCalc: number | undefined;
            if (quotation.estimatedBudget) {
                const { advanceAmount, balanceAmount } = this.calculateQuotationAmounts(quotation.estimatedBudget);
                advanceAmountCalc = advanceAmount;
                balanceAmountCalc = balanceAmount;
            }
            const quotationDataForDb = {
                ...quotation,
                advanceAmount: advanceAmountCalc,
                balanceAmount: balanceAmountCalc,
            }
            const updatedQuotation = await this.quotationModel.findByIdAndUpdate(quotationId, quotationDataForDb, { new: true }) as QuotationResponseDto;
            return updatedQuotation;
        } catch (error) {
            this.logger.error(`Error updating quotation: ${error.message}`);
            throw error;
        }
    }

    async deleteQuotation(quotationId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            await this.quotationModel.deleteOne({ _id: quotationId });
            return { success: true };
        } catch (error) {
            this.logger.error(`Error deleting quotation: ${error.message}`);
            throw error;
        }
    }

    async updateProfileImage(userId: Types.ObjectId, profileImageUrl: string): Promise<UserBaseResponseDto | null> {
        try {
            return await this.userModel.findOneAndUpdate({ _id: userId }, { profileImage: profileImageUrl }, { new: true })
        } catch (error) {
            this.logger.error(`Error updating profile image: ${error.message}`);
            throw error;
        }
    }

    async uploadFiles(files: Express.Multer.File[], folder?: string): Promise<FileUploadResult[]> {
        try {
            const uploadPromises = await this.cloudinaryService.uploadFiles(files, folder);
            return Promise.all(uploadPromises);
        } catch (error) {
            this.logger.error(`Error in uploadFiles: ${error.message}`);
            throw error;
        }
    }

    async updateProfile(userId: Types.ObjectId, updateProfileDto: UpdateProfileDto): Promise<UserProfileResponseDto | null> {
        try {
            return await this.userModel.findOneAndUpdate({ _id: userId }, { $set: updateProfileDto })
        } catch (error) {
            this.logger.error(`Error updating profile: ${error.message}`);
            throw error;
        }
    }

    async resetPassword(userId: Types.ObjectId, resetPasswordDto: ResetPasswordDto): Promise<SuccessResponseDto> {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) throw new Error('User not found');
            const isPasswordValid = await bcrypt.compare(resetPasswordDto.currentPassword, user.password);
            if (!isPasswordValid) throw new Error('Current password is incorrect');
            const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
            await this.userModel.updateOne({ _id: userId }, { $set: { password: hashedPassword } });
            return { success: true };
        } catch (error) {
            this.logger.error(`Error resetting password: ${error.message}`);
            throw error;
        }
    }

    async getCompletedWorks(userId: Types.ObjectId): Promise<CompletedWorkDto[]> {
        try {
            const completedQuotations = await this.quotationModel
                .find({ userId, status: QuotationStatus.COMPLETED })
                .populate('worksId')
                .sort({ createdAt: -1 })
                .lean();

            return completedQuotations.map(quotation => {
                const worksData = quotation.worksId as any || {};
                const { worksId, ...quotationData } = quotation;
                return {
                    ...quotationData,
                    ...worksData,
                    quotationId: quotation._id,
                    worksId: worksData._id || null,
                    finalFiles: worksData.finalFiles || [],
                    attachedFiles: quotationData.attachedFiles || [],
                    comments: worksData.comments || '',
                    completedAt: worksData.createdAt,
                } as CompletedWorkDto;
            })
        } catch (error) {
            this.logger.error(`Error fetching completed works: ${error}`);
            throw error;
        }
    }

    async rateWork(workId: string, rateWorkDto: RateWorkDto): Promise<SuccessResponseDto> {
        try {
            this.logger.log('rating work:', workId, rateWorkDto.rating, rateWorkDto.feedback);
            const result = await this.workModel.updateOne({ _id: new Types.ObjectId(workId) }, { $set: { rating: rateWorkDto.rating, feedback: rateWorkDto.feedback } });
            console.log('rating work success');
            if (result.matchedCount > 0 && result.modifiedCount > 0) {
                return { success: true };
            } else {
                return { success: false };
            }
        } catch (error) {
            this.logger.error(`Error rating work: ${error.message}`);
            throw error;
        }
    }

    async rateEditor(userId: Types.ObjectId, rateEditorDto: RateEditorDto): Promise<SuccessResponseDto> {
        try {
            this.logger.log('rating editor dto from service:', rateEditorDto.editorId, rateEditorDto.rating, rateEditorDto.feedback, userId);
            const result = await this.editorModel.updateOne({ userId: new Types.ObjectId(rateEditorDto.editorId) }, { $push: { ratings: { rating: rateEditorDto.rating, feedback: rateEditorDto.feedback, userId } } });
            if (result.matchedCount > 0 && result.modifiedCount > 0) {
                this.logger.log('rating editor success');
                return { success: true };
            } else {
                this.logger.log('rating editor failed');
                return { success: false };
            }
        } catch (error) {
            this.logger.error(`Error rating editor: ${error.message}`);
            throw error;
        }
    }

    async getCurrentEditorRating(userId: Types.ObjectId, editorId: string):Promise<UserRatingForEditorDto | null> {
        try {
            const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) }).select('ratings').lean();
            if (editor?.ratings && editor.ratings.length > 0) {
                this.logger.log(`Editor ratings for user ${editorId}: ${editor.ratings}`);
                const specificRating = editor.ratings.find((rating) => rating.userId.equals(userId));
                if (specificRating) {
                    this.logger.log(`Current rating of user ${userId} on editor ${editorId}: ${specificRating.rating}`);
                    return {
                        rating: specificRating.rating,
                        feedback: specificRating.feedback,
                        userId: specificRating.userId.toString(), // Convert ObjectId to string
                    };
                }
                this.logger.log(`No specific rating found for user ${userId} on editor ${editorId}`);
                return null;
            }
            this.logger.log(`No ratings found for editor ${editorId}`);
            return null;
        } catch (error) {
            this.logger.error(`Error getting current editor rating: ${error.message}`);
            throw error;
        }
    }

    async updateWorkPublicStatus(worksId: string, updateWorkPublicStatusDto: UpdateWorkPublicStatusDto): Promise<SuccessResponseDto> {
        try {
            const result = await this.workModel.updateOne({ _id: new Types.ObjectId(worksId) }, { $set: { isPublic: updateWorkPublicStatusDto.isPublic } });
            if (result.matchedCount > 0 && result.modifiedCount > 0) {
                this.logger.log('Work public status updated successfully');
                return { success: true };
            } else {
                this.logger.log('Work public status update failed');
                return { success: false };
            }
        } catch (error) {
            this.logger.error(`Error updating work public status: ${error.message}`);
            throw error;
        }
    }

    async getPublicWorks(
        params: GetPublicWorksQueryDto,
    ): Promise<PaginatedPublicWorksResponseDto> {
        try {
            this.logger.log(`getPublicWorks called with: page=${params.page}, limit=${params.limit}, rating=${params.rating}, search="${params.search}"`);

            const filter: any = { isPublic: true };

            if (params.rating !== undefined && params.rating !== null) {
                filter.rating = params.rating;
            }

            if (params.search && params.search.trim()) {
                const searchTerm = params.search.trim().toLowerCase();
                this.logger.log(`Searching for term: "${searchTerm}"`);

                // Find users and editors that match the search term
                const [matchingUsers, matchingEditors] = await Promise.all([
                    this.userModel.find({
                        fullname: { $regex: searchTerm, $options: 'i' }
                    }).select('_id').lean(),

                    this.editorModel.find({
                        fullname: { $regex: searchTerm, $options: 'i' }
                    }).select('_id').lean()
                ]);

                this.logger.log(`Found ${matchingUsers.length} matching users and ${matchingEditors.length} matching editors`);

                const userIds = matchingUsers.map(user => user._id.toString());
                const editorIds = matchingEditors.map(editor => editor._id.toString());

                // If we found matching users or editors, add them to the filter
                if (userIds.length > 0 || editorIds.length > 0) {
                    filter.$or = [];

                    if (userIds.length > 0) {
                        filter.$or.push({ userId: { $in: userIds } });
                    }

                    if (editorIds.length > 0) {
                        filter.$or.push({ editorId: { $in: editorIds } });
                    }
                } else if (params.search.trim()) {
                    // If search term was provided but no matches found, return empty results
                    this.logger.log(`No matching users or editors found for "${searchTerm}", returning empty results`);
                    return { works: [], total: 0 };
                }
            }

            this.logger.log(`Final filter: ${JSON.stringify(filter)}`);

            // Execute the query with pagination
            const [works, total] = await Promise.all([
                this.workModel.find(filter)
                    .sort({ createdAt: -1 })
                    .skip((params.page - 1) * params.limit)
                    .limit(params.limit)
                    .populate<{
                        editorId: { _id: Types.ObjectId; fullname: string; username: string; email: string; profileImage?: string } | null; 
                        userId: { _id: Types.ObjectId; fullname: string; username: string; email: string; profileImage?: string } | null;
                    }>([
                        {
                            path: 'editorId',
                            select: 'fullname username profileImage email _id', // Ensured _id and email are selected
                            model: this.userModel
                        },
                        {
                            path: 'userId',
                            select: 'fullname username profileImage email _id', // Ensured _id and email are selected
                            model: this.userModel
                        }
                    ])
                    .lean(), 
                this.workModel.countDocuments(filter)
            ]);
            const publicWorksDto: PublicWorkItemDto[] = works.map(work => {
                // Type assertion for populated fields if necessary, or ensure populate returns the expected shape
                const editorInfo = work.editorId as any; // Assuming editorId is populated with user-like info
                const userInfo = work.userId as any; // Assuming userId is populated with user-like info

                return {
                    _id: work._id.toString(),
                    comments: work.comments,
                    isPublic: !!work.isPublic,
                    finalFiles: work.finalFiles as unknown as FileUploadResultDto[] || [],
                    rating: work.rating,
                    feedback: work.feedback,
                    createdAt: work.createdAt,
                    updatedAt: work.updatedAt,
                    editorId: work.editorId,
                    userId: work.userId,
                    editor:{
                        _id: editorInfo._id.toString(),
                        fullname: editorInfo.fullname,
                        username: editorInfo.username,
                        email: editorInfo.email,
                        profileImage: editorInfo.profileImage,
                    },
                    user:{
                        _id: userInfo._id.toString(),
                        fullname: userInfo.fullname,
                        username: userInfo.username,
                        email: userInfo.email,
                        profileImage: userInfo.profileImage,
                    },
                };
            });
            this.logger.log(`Found ${works.length} works out of ${total} total`);
            this.logger.log(`public works: `, publicWorksDto);
            return { works:publicWorksDto, total };
        } catch (error) {
            this.logger.error(`Error getting public works: ${error.message}`);
            throw error;
        }
    }

    async getUser(userId: Types.ObjectId): Promise<UserBasicInfoDto | null> {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                this.logger.log('User not found');
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            this.logger.error(`Error getting user: ${error.message}`);
            throw error;
        }
    }

    async createTransaction(userId: Types.ObjectId, quotationId: Types.ObjectId, paymentDetails: {
        paymentId: string;
        orderId: string;
        amount: number;
        paymentType: PaymentType
    }): Promise<TransactionResponseDto>{
        try {
            const transaction = await this.transactionModel.create({
                userId,
                quotationId,
                ...paymentDetails,
                status: PaymentStatus.COMPLETED,
            });

            if (paymentDetails.paymentType === PaymentType.ADVANCE) {
                await this.quotationModel.updateOne(
                    { _id: quotationId },
                    { $set: { isAdvancePaid: true } }
                );
            } else {
                await this.quotationModel.updateOne(
                    { _id: quotationId },
                    { $set: { isFullyPaid: true } }
                );
            }

            return transaction;
        } catch (error) {
            this.logger.error(`Error updating quotation payment: ${error.message}`);
            throw error;
        }
    }

    async getQuotationTransactions(quotationId: Types.ObjectId) {
        return this.transactionModel.find({ quotationId })
            .sort({ createdAt: -1 })
            .exec();
    }

    async getBidsByQuotation(quotationId: Types.ObjectId, userId: Types.ObjectId): Promise<BidResponseDto[]> {
        const quotation = await this.quotationModel.findOne({ _id: quotationId, userId: userId.toString() });
        if (!quotation) {
            throw new NotFoundException('Quotation not found or does not belong to you');
        }

        const bids = await this.bidsService.findAllByQuotation(quotation._id);
        return bids;
    }

    async acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId): Promise<BidResponseDto> {
        const bid = await this.bidsService.acceptBid(bidId, userId);

        // Get the quotation to send notification
        const quotation = await this.quotationModel.findById(bid.quotationId);

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        return bid;
    }

    async getEditorPublicProfile(editorId: string): Promise<EditorPublicProfileResponseDto> {
        if (!Types.ObjectId.isValid(editorId)) {
            this.logger.log(`Invalid editor ID format: ${editorId}`);
            throw new BadRequestException('Invalid editor ID format.');
        }

        const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) }).populate('userId').lean();

        if (!editor || !editor.userId) {
            this.logger.log(`Editor with user ID ${editorId} not found.`);
            throw new NotFoundException(`Editor with user ID ${editorId} not found.`);
        }

        const user = editor.userId as unknown as User;

        const averageRating = this.calculateAverageRating(editor.ratings);

        return {
            _id: user._id,
            username: user.username,
            fullname: user.fullname,
            profileImage: user.profileImage || '',
            score: editor.score || 0,
            averageRating,
            categories: editor.category || [],
            about: user.about || '',
            sharedTutorials: editor.sharedTutorials || [],
            tipsAndTricks: editor.tipsAndTricks || '',
            socialLinks: editor.socialLinks || {},
        };
    }

    async getPublicEditors(params: GetPublicEditorsDto): Promise<PaginatedPublicEditorsDto> {
        let { search, category, rating, page = 1, limit = 10 } = params;
        limit = parseInt(limit.toString());
        page = parseInt(page.toString());
        rating = rating ? parseInt(rating.toString()) : undefined;

        const skip = (page - 1) * limit;
    
        const matchStage: any = { 'user.isVerified': true };
    
        if (search) {
          matchStage['$or'] = [
            { 'user.fullname': { $regex: search, $options: 'i' } },
            { 'user.username': { $regex: search, $options: 'i' } },
          ];
        }
    
        if (category) {
          matchStage.category = category;
        }
    
        const pipeline: any[] = [
          { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $match: matchStage },
          {
            $addFields: {
              averageRating: { $ifNull: [{ $avg: '$ratings.rating' }, 0] },
            },
          },
        ];
    
        if (rating) {
          pipeline.push({ $match: { averageRating: { $gte: rating } } });
        }
    
        pipeline.push(
          {
            $facet: {
              data: [
                { $skip: skip },
                { $limit: limit },
                {
                  $project: {
                    _id: '$user._id',
                    fullname: '$user.fullname',
                    username: '$user.username',
                    profileImage: '$user.profileImage',
                    category: '$category',
                    score: '$score',
                    averageRating: '$averageRating',
                    isVerified: '$user.isVerified',
                  },
                },
              ],
              total: [{ $count: 'count' }],
            },
          },
        );
    
        const result = await this.editorModel.aggregate(pipeline).exec();

        const data = result[0]?.data || [];
        const total = result[0]?.total.length > 0 ? result[0].total[0].count : 0;
    
        return {
          data,
          total,
          page,
          limit,
        };
    }
}
