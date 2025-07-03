import { Injectable, Logger, HttpException, HttpStatus, NotFoundException, InternalServerErrorException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './models/user.schema';
import { Editor, EditorDocument } from 'src/editors/models/editor.schema';
import { EditorRequest, EditorRequestDocument } from 'src/editors/models/editorRequest.schema';
import { Quotation, QuotationDocument } from 'src/quotation/models/quotation.schema';
import { PaymentStatus, PaymentType, Transaction, TransactionDocument } from 'src/common/models/transaction.schema';
import { Bid } from 'src/common/bids/models/bids.schema';
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
    UpdateProfileDto,
    ResetPasswordDto,
    CompletedWorkDto,
    RateEditorDto,
    TransactionResponseDto,
    UserRatingForEditorDto,
    BidResponseDto,
    PaginatedTransactionsResponseDto,
    EditorPublicProfileResponseDto,
    GetPublicEditorsDto,
    PaginatedPublicEditorsDto,
    ReportUserDto
} from './dto/users.dto';
import { GetAllUsersQueryDto } from 'src/admins/dto/admin.dto';
import { Report, ReportDocument } from 'src/common/models/report.schema';
import { IAdminWalletService, IAdminWalletServiceToken } from 'src/wallet/interfaces/admin-wallet.service.interface';
import { getYouTubeEmbedUrl } from 'src/common/utils/youtube-url.util';
import { IRelationshipService, IRelationshipServiceToken } from 'src/common/relationship/interfaces/service.interface';
import { RelationshipType } from 'src/common/enums/relationships.enum';
import { EventTypes } from 'src/common/constants/events.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileUploadResultDto as FileUploadResultDtoCloudinary } from 'src/common/cloudinary/dtos/cloudinary.dto';
import { ICloudinaryService, ICloudinaryServiceToken } from 'src/common/cloudinary/interfaces/cloudinary-service.interface';
import { IUserRepository, IUserRepositoryToken } from './interfaces/users.repository.interface';
import { IBidService, IBidServiceToken } from 'src/common/bids/interfaces/bid.interfaces';
import { GetPublicWorksQueryDto, PaginatedPublicWorksResponseDto, PublicWorkItemDto, RateWorkDto, UpdateWorkPublicStatusDto } from 'src/works/dtos/works.dto';
import { IWorkService, IWorkServiceToken } from 'src/works/interfaces/works.service.interface';
import { IQuotationService, IQuotationServiceToken } from 'src/quotation/interfaces/quotation.service.interface';

@Injectable()
export class UsersService implements IUsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(EditorRequest.name) private editorRequestModel: Model<EditorRequestDocument>,
        @Inject(IQuotationServiceToken) private readonly quotationService: IQuotationService,
        @Inject(IWorkServiceToken) private readonly workService: IWorkService,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
        @Inject(IAdminWalletServiceToken) private readonly adminWalletService: IAdminWalletService,
        @Inject(IRelationshipServiceToken) private readonly relationshipService: IRelationshipService,
        @Inject(ICloudinaryServiceToken) private cloudinaryService: ICloudinaryService,
        @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository,
        @Inject(IBidServiceToken) private bidsService: IBidService,
        private eventEmitter: EventEmitter2,
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
            const newUser = await this.userModel.create(user);
            await this.adminWalletService.creditWelcomeBonus(newUser._id.toString());
            return newUser;
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

                    const [followersCount, followingCount] = await Promise.all([
                        this.relationshipService.getFollowers({ userId: user._id, limit: 0, skip: 0 }).then(f => f.length),
                        this.relationshipService.getFollowing({ userId: user._id, limit: 0, skip: 0 }).then(f => f.length),
                    ]);

                    return {
                        ...userObj,
                        editorDetails: {
                            category: editorDetails.category || [],
                            score: editorDetails.score || 0,
                            tipsAndTricks: editorDetails.tipsAndTricks || '',
                            sharedTutorials: editorDetails.sharedTutorials || [],
                            ratingsCount: editorDetails.ratings?.length || 0,
                            averageRating: this.calculateAverageRating(editorDetails.ratings),
                            socialLinks: editorDetails.socialLinks || {},
                            createdAt: editorDetails.createdAt,
                            followersCount,
                            followingCount,
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

            const findCondition = {
                $or: [
                    { userId: new Types.ObjectId(userId) },
                    { userId: userId as any }
                ]
            };

            const transactionsQuery = await this.transactionModel.find(findCondition)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'quotationId',
                    select: 'title',
                })
                .lean()
                .exec();

            this.logger.log(`Transactions for user ${userId}: `,transactionsQuery);

            const totalItemsQuery = this.transactionModel.countDocuments(findCondition).exec();

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

            const totalItems = await this.quotationService.countQuotationsByFilter(matchQuery);
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

            const quotations = await this.quotationService.aggregate(aggregationPipeline);
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
                attachedFiles: createQuotationDto.attachedFiles?.map(file => {
                    const processedUniqueId = file.uniqueId
                        ? String(file.uniqueId).replace(/ /g, '%20')
                        : '';

                    return {
                        ...file,
                        uniqueId: `${processedUniqueId}.${file.format}`,
                        timestamp: file.timestamp,
                        uploadedAt: new Date(),
                    };
                })
            }
            const savedQuotation = await this.quotationService.createQuotation(quotationDataForDb);

            this.eventEmitter.emit(EventTypes.QUOTATION_CREATED,{
                quotationId: savedQuotation._id.toString(),
                userId: userId.toString(),
                title: savedQuotation.title,
                amount: savedQuotation.estimatedBudget
            })
            return savedQuotation as unknown as QuotationResponseDto;
        } catch (error) {
            this.logger.error(`Error creating quotation: ${error.message}`);
            throw error;
        }
    }

    async getQuotation(quotationId: Types.ObjectId): Promise<QuotationResponseDto | null> {
        try {
            const quotation = await this.quotationService.findById(quotationId) as unknown as QuotationResponseDto;
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
            const updatedQuotation = await this.quotationService.findByIdAndUpdate(quotationId, quotationDataForDb) as unknown as QuotationResponseDto;
            return updatedQuotation;
        } catch (error) {
            this.logger.error(`Error updating quotation: ${error.message}`);
            throw error;
        }
    }

    async deleteQuotation(quotationId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            await this.quotationService.deleteQuotation(quotationId);
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

    async uploadFiles(files: Express.Multer.File[], folder?: string): Promise<FileUploadResultDtoCloudinary[]> {
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
            const completedQuotations = await this.quotationService.getCompletedQuotationsForUser(userId);

            if(!completedQuotations) return [];
            
            return completedQuotations.map((quotation: Quotation) => {
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
            return this.workService.rateWork(workId, rateWorkDto);
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
            return this.workService.updateWorkPublicStatus(worksId, updateWorkPublicStatusDto);
        } catch (error) {
            this.logger.error(`Error updating work public status: ${error.message}`);
            throw error;
        }
    }

    async getPublicWorks(
        params: GetPublicWorksQueryDto,
    ): Promise<PaginatedPublicWorksResponseDto> {
        try {
            this.logger.log(`Delegating getPublicWorks to WorksService with params: ${JSON.stringify(params)}`);
            return this.workService.getPublicWorks(params);
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
        razorpayPaymentMethod: string;
        currency: string;
        bank: string;
        wallet: string;
        fee: number;
        tax: number;
        paymentDate: Date;
        amount: number;
        paymentType: PaymentType
    }): Promise<TransactionResponseDto>{
        try {
            const transaction = await this.transactionModel.create({
                userId: new Types.ObjectId(userId),
                quotationId: new Types.ObjectId(quotationId),
                paymentId: paymentDetails.paymentId,
                orderId: paymentDetails.orderId,
                razorpayPaymentMethod: paymentDetails.razorpayPaymentMethod, 
                currency: paymentDetails.currency,
                bank: paymentDetails.bank,
                wallet: paymentDetails.wallet,
                fee: paymentDetails.fee,
                tax: paymentDetails.tax,
                amount: paymentDetails.amount,
                paymentType: paymentDetails.paymentType,
                paymentDate: paymentDetails.paymentDate,
                status: PaymentStatus.COMPLETED,
            });

            if (paymentDetails.paymentType === PaymentType.ADVANCE) {
                await this.quotationService.updateQuotation(
                    { _id: quotationId },
                    { $set: { isAdvancePaid: true } }
                );
            } else {
                await this.quotationService.updateQuotation(
                    { _id: quotationId },
                    { $set: { isFullyPaid: true } }
                );
            }
            const quotation = await this.quotationService.updateQuotation({ _id: quotationId }, { isPaymentInProgress: true }) as Quotation;
            if(quotation.isFullyPaid){
                await this.adminWalletService.recordUserPayment(quotation, paymentDetails.paymentId);
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
        const quotation = await this.quotationService.findOne({ _id: quotationId, userId: userId.toString() });
        if (!quotation) {
            throw new NotFoundException('Quotation not found or does not belong to you');
        }

        const bids = await this.bidsService.findAllByQuotation(quotation._id);
        return bids;
    }

    async acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId): Promise<BidResponseDto> {
        const bid = await this.bidsService.acceptBid(bidId, userId);

        // Get the quotation to send notification
        const quotation = await this.quotationService.findById(bid.quotationId);

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        return bid;
    }

    async getAcceptedBid(quotationId: Types.ObjectId, editorId: Types.ObjectId): Promise<Bid> {
        const bid = await this.bidsService.getAcceptedBid(quotationId, editorId);
        return bid;
    }

    async cancelAcceptedBid(bidId: Types.ObjectId, requesterId: Types.ObjectId): Promise<SuccessResponseDto> {
        await this.bidsService.cancelAcceptedBid(bidId, requesterId);
        return { success: true, message: 'Bid cancelled successfully' };
    }

    async getEditorPublicProfile(editorId: string, currentUserId?:string): Promise<EditorPublicProfileResponseDto> {
        if (!Types.ObjectId.isValid(editorId)) {
            this.logger.log(`Invalid editor ID format: ${editorId}`);
            throw new BadRequestException('Invalid editor ID format.');
        }

        const editorObjectId = new Types.ObjectId(editorId);

        const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) }).populate('userId').lean();

        if (!editor || !editor.userId) {
            this.logger.log(`Editor with user ID ${editorId} not found.`);
            throw new NotFoundException(`Editor with user ID ${editorId} not found.`);
        }

        const user = editor.userId as unknown as User;

        const [followersCount, followingCount, isFollowing] = await Promise.all([
            this.relationshipService.getFollowers({ userId: editorObjectId, limit: 0, skip: 0 }).then(f => f.length),
            this.relationshipService.getFollowing({ userId: editorObjectId, limit: 0, skip: 0 }).then(f => f.length),
            currentUserId && Types.ObjectId.isValid(currentUserId)
                ? this.relationshipService.isFollowing(new Types.ObjectId(currentUserId), editorObjectId)
                : Promise.resolve(false),
        ]);

        const averageRating = this.calculateAverageRating(editor.ratings);

        const sharedTutorials = (editor.sharedTutorials || [])
            .map(getYouTubeEmbedUrl)
            .filter(url => url !== '');

        return {
            _id: user._id,
            username: user.username,
            fullname: user.fullname,
            profileImage: user.profileImage || '',
            score: editor.score || 0,
            averageRating,
            categories: editor.category || [],
            about: user.about || '',
            sharedTutorials,
            tipsAndTricks: editor.tipsAndTricks || '',
            socialLinks: editor.socialLinks || {},
            followersCount,
            followingCount,
            isFollowing,
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

    async reportUser(reportDto: ReportUserDto, reporterId: string): Promise<SuccessResponseDto> {
        try {
            await this.reportModel.create({
                reporterId: new Types.ObjectId(reporterId),
                reportedUserId: new Types.ObjectId(reportDto.reportedUserId),
                context: reportDto.context.trim(),
                reason: reportDto.reason.trim(),
                additionalContext: reportDto.additionalContext?.trim(),
            })
            return { success: true, message: 'Report submitted successfully' };
        } catch (error) {
            this.logger.error(`Error reporting user: ${error.message}`);
            throw error;
        }
    }

    async followUser(sourceUserId: Types.ObjectId, targetUserId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            await this.relationshipService.createRelationship({
                sourceUser: sourceUserId,
                targetUser: targetUserId,
                type: RelationshipType.FOLLOWS,
            });
            return { success: true, message: 'User followed successfully' };
        } catch (error) {
            this.logger.error(`Error following user: ${error.message}`);
            throw error;
        }
    }

    async unfollowUser(sourceUserId: Types.ObjectId, targetUserId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            await this.relationshipService.removeRelationship({
                sourceUser: sourceUserId,
                targetUser: targetUserId,
                type: RelationshipType.FOLLOWS,
            });
            return { success: true, message: 'User unfollowed successfully' };
        } catch (error) {
            this.logger.error(`Error unfollowing user: ${error.message}`);
            throw error;
        }
    }

    async getUserById(userId: Types.ObjectId): Promise<User | null> {
        return this.userRepository.findById(userId);
    }

    async blockUser(userId: Types.ObjectId): Promise<User | null> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.userRepository.findOneAndUpdate({ _id: userId }, { isBlocked: !user.isBlocked });
    }

    async countAllUsers(): Promise<number> {
        return this.userRepository.countDocuments();
    }

    async getAllUsersForAdmin(query: GetAllUsersQueryDto): Promise<User[]> {
        const filter: any = {};
        if (query.isEditor !== undefined) filter.isEditor = query.isEditor;
        if (query.gender) filter.gender = query.gender;
        if (query.behaviourRating) filter.behaviourRating = query.behaviourRating;
        if (query.search) filter.username = { $regex: query.search, $options: 'i' };

        return this.userRepository.find(filter);
    }

    async makeUserEditor(userId: Types.ObjectId): Promise<User | null> {
        try {
            return this.userRepository.findOneAndUpdate({ _id: userId }, { isEditor: true });
        } catch (error) {
            this.logger.error(`Error making user editor: ${error.message}`);
            throw error;
        }
    }
}
