import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilterQuery, Types } from 'mongoose';
import { GetAllUsersQueryDto } from 'src/admins/dto/admin.dto';
import {
  IBidService,
  IBidServiceToken,
} from 'src/common/bids/interfaces/bid.interfaces';
import { Bid } from 'src/common/bids/models/bids.schema';
import { FileUploadResultDto as FileUploadResultDtoCloudinary } from 'src/common/cloudinary/dtos/cloudinary.dto';
import {
  ICloudinaryService,
  ICloudinaryServiceToken,
} from 'src/common/cloudinary/interfaces/cloudinary-service.interface';
import { EventTypes } from 'src/common/constants/events.constants';
import { RelationshipType } from 'src/common/enums/relationships.enum';
import {
  IHashingService,
  IHashingServiceToken,
} from 'src/common/hashing/interfaces/hashing.service.interface';
import {
  IRelationshipService,
  IRelationshipServiceToken,
} from 'src/common/relationship/interfaces/service.interface';
import {
  GetTransactionsQueryDto,
  IFindOptions,
} from 'src/common/transaction/dtos/transaction.dto';
import {
  ITransactionService,
  ITransactionServiceToken,
} from 'src/common/transaction/interfaces/transaction.service.interface';
import {
  PaymentStatus,
  PaymentType,
} from 'src/common/transaction/models/transaction.schema';
import { getYouTubeEmbedUrl } from 'src/common/utils/youtube-url.util';
import {
  IEditorsService,
  IEditorsServiceToken,
} from 'src/editors/interfaces/services/editors.service.interface';
import { CompletedWorkDto } from 'src/quotation/dtos/quotation.dto';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
import { Quotation } from 'src/quotation/models/quotation.schema';
import {
  IReportService,
  IReportServiceToken,
} from 'src/reports/interfaces/reports.service.interface';
import {
  ITimelineService,
  ITimelineServiceToken,
} from 'src/timeline/interfaces/timeline.service.interface';
import { TimelineEvent } from 'src/timeline/models/timeline.schema';
import {
  IAdminWalletService,
  IAdminWalletServiceToken,
} from 'src/wallet/interfaces/admin-wallet.service.interface';
import {
  GetPublicWorksQueryDto,
  PaginatedPublicWorksResponseDto,
  PublicWorkItemDto,
  RateWorkDto,
  UpdateWorkPublicStatusDto,
} from 'src/works/dtos/works.dto';
import {
  IWorkService,
  IWorkServiceToken,
} from 'src/works/interfaces/works.service.interface';

import {
  CreateQuotationDto,
  UpdateQuotationDto,
  GetQuotationsParamsDto,
  PaginatedQuotationsResponseDto,
  UserBaseResponseDto,
  UserProfileResponseDto,
  UserBasicInfoDto,
  SuccessResponseDto,
  EditorRequestStatusResponseDto,
  QuotationResponseDto,
  UpdateProfileDto,
  ResetPasswordDto,
  RateEditorDto,
  TransactionResponseDto,
  UserRatingForEditorDto,
  BidResponseDto,
  PaginatedTransactionsResponseDto,
  EditorPublicProfileResponseDto,
  GetPublicEditorsDto,
  PaginatedPublicEditorsDto,
  ReportUserDto,
} from '../dto/users.dto';
import {
  IUserRepository,
  IUserRepositoryToken,
} from '../interfaces/users.repository.interface';
import {
  IUsersService,
  UserInfoForChatListDto,
} from '../interfaces/services/users.service.interface';
import { User } from '../models/user.schema';
import { IUserQuotationService, IUserQuotationServiceToken } from '../interfaces/services/user-quotation.service.interface';

@Injectable()
export class UsersService implements IUsersService {
  private readonly _logger = new Logger(UsersService.name);
  constructor(
    @Inject(forwardRef(() => IEditorsServiceToken))
    private readonly _editorService: IEditorsService,
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
    @Inject(IWorkServiceToken) private readonly _workService: IWorkService,
    @Inject(ITransactionServiceToken)
    private readonly _transactionService: ITransactionService,
    @Inject(IReportServiceToken)
    private readonly _reportService: IReportService,
    @Inject(IAdminWalletServiceToken)
    private readonly _adminWalletService: IAdminWalletService,
    @Inject(IRelationshipServiceToken)
    private readonly _relationshipService: IRelationshipService,
    @Inject(ICloudinaryServiceToken)
    private readonly _cloudinaryService: ICloudinaryService,
    @Inject(IUserRepositoryToken)
    private readonly _userRepository: IUserRepository,
    @Inject(IBidServiceToken) private readonly _bidsService: IBidService,
    @Inject(IHashingServiceToken)
    private readonly _hashingService: IHashingService,
    @Inject(ITimelineServiceToken)
    private readonly _timelineService: ITimelineService,
    @Inject(IUserQuotationServiceToken)
    private readonly _userQuotationService: IUserQuotationService,
  ) {}

  async findOne(filter: Partial<User>): Promise<User | null> {
    try {
      return this._userRepository.findOne(filter);
    } catch (error) {
      this._logger.error(`Error finding user: ${error.message}`);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async findByUsername(username: string) {
    return await this._userRepository.findOne({ username });
  }

  async findByEmail(email: string) {
    return await this._userRepository.findOne({ email });
  }

  async createUser(user: Partial<User>): Promise<User> {
    try {
      if (user.password) {
        user.password = await this._hashingService.hash(user.password);
      }
      this._logger.log(`Creating new user: ${user.email}`);
      const newUser = await this._userRepository.create(user);
      await this._adminWalletService.creditWelcomeBonus(newUser._id.toString());
      return newUser;
    } catch (error) {
      this._logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  private async _generateUniqueUsername(): Promise<string> {
    let isUnique = false;
    let username = '';

    while (!isUnique) {
      const randomString = Math.random().toString(36).substring(2, 6);
      username = `user_${randomString}`;

      const existingUser = await this._userRepository.findOne({ username });
      if (!existingUser) {
        isUnique = true;
      }
    }
    return username;
  }

  async createGoogleUser(user: Partial<User>): Promise<User> {
    try {
      if (!user.username) {
        user.username = await this._generateUniqueUsername();
      }
      user.isVerified = true;
      return this.createUser(user);
    } catch (error) {
      this._logger.error(`Failed to create Google user: ${error.message}`);
      throw error;
    }
  }

  async updateUserGoogleId(
    userId: Types.ObjectId,
    googleId: string,
  ): Promise<User | null> {
    try {
      return await this._userRepository.findOneAndUpdate(
        { _id: userId },
        { $set: { googleId } },
      );
    } catch (error) {
      this._logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  async updateOne(filter: Partial<User>, update: Partial<User>) {
    try {
      await this._userRepository.findOneAndUpdate(filter, update);
      this._logger.log('User data updated successfully');
    } catch (error) {
      this._logger.error(`Error updating User: ${error.message}`);
      throw error;
    }
  }

  async updatePassword(
    userId: Types.ObjectId,
    password: string,
  ): Promise<boolean> {
    try {
      this._logger.log(userId, password);
      await this._userRepository.findOneAndUpdate(
        { _id: userId },
        { $set: { password } },
      );
      this._logger.log('Password updated successfully');
      return true;
    } catch (error) {
      this._logger.error(`Error updating password: ${error.message}`);
      throw error;
    }
  }

  async getUserDetails(
    userId: Types.ObjectId,
  ): Promise<UserProfileResponseDto | null> {
    try {
      this._logger.log(`Fetching user details for ID: ${userId}`);
      const user = await this._userRepository.findById(userId);
      if (user && user.isEditor) {
        this._logger.log('Fetching the editor details');
        console.log('user id: ', user._id);
        const editorDetails = await this._editorService.findByUserId(user._id);
        if (editorDetails) {
          this._logger.log('Editor details: ', editorDetails);

          const [followersCount, followingCount] = await Promise.all([
            this._relationshipService
              .getFollowers({ userId: user._id, limit: 0, skip: 0 })
              .then((f) => f.length),
            this._relationshipService
              .getFollowing({ userId: user._id, limit: 0, skip: 0 })
              .then((f) => f.length),
          ]);

          return {
            ...user.toObject(),
            editorDetails: {
              category: editorDetails.category || [],
              score: editorDetails.score || 0,
              tipsAndTricks: editorDetails.tipsAndTricks || '',
              sharedTutorials: editorDetails.sharedTutorials || [],
              ratingsCount: editorDetails.ratings?.length || 0,
              averageRating: this._calculateAverageRating(
                editorDetails.ratings,
              ),
              socialLinks: editorDetails.socialLinks || {},
              warningCount: editorDetails.warningCount || 0,
              createdAt: editorDetails.createdAt,
              followersCount,
              followingCount,
            },
          };
        } else console.log('no editor details');
      }
      return user;
    } catch (error) {
      this._logger.error(`Error fetching user details: ${error.message}`);
      throw error;
    }
  }

  async getUsers(currentUserId: Types.ObjectId): Promise<UserBasicInfoDto[]> {
    try {
      const { items } = await this._userRepository.find({
        _id: { $ne: currentUserId },
      });
      return items;
    } catch (error) {
      this._logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  async getUserInfoForChatList(
    userId: Types.ObjectId,
  ): Promise<UserInfoForChatListDto> {
    try {
      const userInfo = await this._userRepository.findById(userId, {
        username: 1,
        profileImage: 1,
        isOnline: 1,
      });
      if (!userInfo) {
        throw new NotFoundException('No user info found for your chats');
      }
      return userInfo;
    } catch (error) {
      this._logger.error(
        `Error fetching user info for chat list: ${error.message}`,
      );
      throw error;
    }
  }

  private _calculateAverageRating(ratings: any[] | undefined): number {
    if (!ratings || ratings.length === 0) return 0;

    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  }

  async requestForEditor(userId: Types.ObjectId): Promise<SuccessResponseDto> {
    try {
      const user = await this._userRepository.findById(userId, { isEditor: 1 });
      if (user && !user.isEditor) {
        this._logger.log(
          `User ${userId} is not an editor. Proceeding with request.`,
        );
        if (await this._editorService.checkEditorRequest(userId)) {
          this._logger.log(`User ${userId} already has an editor request`);
          await this._editorService.deleteEditorRequest(userId);
        }
        await this._editorService.createEditorRequest(userId);
        this._logger.log(`Editor request created for user ${userId}`);
        return { success: true };
      }
      this._logger.log(`User ${userId} is already an editor or not found`);
      return { success: false };
    } catch (error) {
      this._logger.error(`Error requesting editor role: ${error.message}`);
      return { success: false };
    }
  }

  async getEditorRequestStatus(
    userId: Types.ObjectId,
  ): Promise<EditorRequestStatusResponseDto> {
    try {
      const request = await this._editorService.findEditorRequest(userId);
      if (request) {
        this._logger.log(
          `Editor request status for user ${userId}: ${request.status}`,
        );
        return { status: request.status };
      }
      return { status: null };
    } catch (error) {
      this._logger.error(
        `Error fetching editor request status: ${error.message}`,
      );
      throw error;
    }
  }

  async getTransactionHistory(
    userId: string,
    query: GetTransactionsQueryDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    try {
      const { page = 1, limit = 10, paymentType, status } = query;
      const skip = (page - 1) * limit;

      const findCondition: any = {
        $or: [{ userId: new Types.ObjectId(userId) }, { userId: userId }],
      };

      if (paymentType) findCondition.paymentType = paymentType;
      if (status) findCondition.status = status;

      const findOptions: IFindOptions = {
        sort: { createdAt: -1 },
        skip: skip,
        limit: limit,
        populate: {
          path: 'quotationId',
          select: 'title',
        },
      };

      const [transactions, totalItems] = await Promise.all([
        this._transactionService.getTransactions(findCondition, findOptions),
        this._transactionService.countTransactions(findCondition),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        transactions: transactions as any,
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (error) {
      this._logger.error(
        `Error fetching transaction history for user ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to fetch transaction history.',
      );
    }
  }

  async getQuotations(
    userId: Types.ObjectId,
    params: GetQuotationsParamsDto,
  ): Promise<PaginatedQuotationsResponseDto> {
    return this._userQuotationService.getQuotations(userId, params);
  }

  private _calculateQuotationAmounts(estimatedBudget: number): {
    advanceAmount: number;
    balanceAmount: number;
  } {
    const advancePercentage = 0.4;
    const advanceAmount = Math.round(estimatedBudget * advancePercentage);
    const balanceAmount = estimatedBudget - advanceAmount;
    return { advanceAmount, balanceAmount };
  }

  async createQuotation(
    userId: Types.ObjectId,
    createQuotationDto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return this._userQuotationService.createQuotation(userId, createQuotationDto);
  }

  async getQuotation(
    quotationId: Types.ObjectId,
  ): Promise<QuotationResponseDto | null> {
    return this._userQuotationService.getQuotation(quotationId);
  }

  async updateQuotation(
    quotationId: Types.ObjectId,
    userId: Types.ObjectId,
    updateQuotationDto: UpdateQuotationDto,
  ): Promise<QuotationResponseDto | null> {
    return this._userQuotationService.updateQuotation(quotationId, userId, updateQuotationDto);
  }

  async deleteQuotation(
    quotationId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    return this._userQuotationService.deleteQuotation(quotationId);
  }

  async updateProfileImage(
    userId: Types.ObjectId,
    profileImageUrl: string,
  ): Promise<UserBaseResponseDto | null> {
    try {
      return await this._userRepository.findOneAndUpdate(
        { _id: userId },
        { profileImage: profileImageUrl },
      );
    } catch (error) {
      this._logger.error(`Error updating profile image: ${error.message}`);
      throw error;
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<FileUploadResultDtoCloudinary[]> {
    try {
      const uploadPromises = await this._cloudinaryService.uploadFiles(
        files,
        folder,
      );
      return Promise.all(uploadPromises);
    } catch (error) {
      this._logger.error(`Error in uploadFiles: ${error.message}`);
      throw error;
    }
  }

  async updateProfile(
    userId: Types.ObjectId,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto | null> {
    try {
      return await this._userRepository.findOneAndUpdate(
        { _id: userId },
        { $set: updateProfileDto },
      );
    } catch (error) {
      this._logger.error(`Error updating profile: ${error.message}`);
      throw error;
    }
  }

  async resetPassword(
    userId: Types.ObjectId,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<SuccessResponseDto> {
    try {
      const user = await this._userRepository.findById(userId);
      if (!user) throw new Error('User not found');
      const isPasswordValid = await this._hashingService.compare(
        resetPasswordDto.currentPassword,
        user.password,
      );
      if (!isPasswordValid) throw new Error('Current password is incorrect');
      const hashedPassword = await this._hashingService.hash(
        resetPasswordDto.newPassword,
      );
      await this._userRepository.findOneAndUpdate(
        { _id: userId },
        { $set: { password: hashedPassword } },
      );
      return { success: true };
    } catch (error) {
      this._logger.error(`Error resetting password: ${error.message}`);
      throw error;
    }
  }

  async getCompletedWorks(userId: Types.ObjectId): Promise<CompletedWorkDto[]> {
    try {
      return await this._quotationService.getCompletedQuotationsForUser(userId);
    } catch (error) {
      this._logger.error(`Error fetching completed works: ${error}`);
      throw error;
    }
  }

  async rateWork(
    workId: string,
    rateWorkDto: RateWorkDto,
  ): Promise<SuccessResponseDto> {
    try {
      return this._workService.rateWork(workId, rateWorkDto);
    } catch (error) {
      this._logger.error(`Error rating work: ${error.message}`);
      throw error;
    }
  }

  async rateEditor(
    userId: Types.ObjectId,
    rateEditorDto: RateEditorDto,
  ): Promise<SuccessResponseDto> {
    try {
      this._logger.log(
        'rating editor dto from service:',
        rateEditorDto.editorId,
        rateEditorDto.rating,
        rateEditorDto.feedback,
        userId,
      );
      const editorObjectId = new Types.ObjectId(rateEditorDto.editorId);

      await this._editorService.updateEditor(editorObjectId, {
        $pull: { ratings: { userId: userId } },
      });

      const result = await this._editorService.updateEditor(editorObjectId, {
        $push: {
          ratings: {
            rating: rateEditorDto.rating,
            feedback: rateEditorDto.feedback,
            userId,
          },
        },
      });

      if (result) {
        this._logger.log('rating editor success');
        return { success: true };
      } else {
        this._logger.error(
          'rating editor failed: Editor not found or not updated',
        );
        throw new NotFoundException(
          'Editor not found or rating could not be updated.',
        );
      }
    } catch (error) {
      this._logger.error('rating editor failed', error);
      throw new InternalServerErrorException('Failed to rate editor');
    }
  }

  async getCurrentEditorRating(
    userId: Types.ObjectId,
    editorId: string,
  ): Promise<UserRatingForEditorDto | null> {
    try {
      const editor = await this._editorService.getEditorRating(
        new Types.ObjectId(editorId),
      );
      if (editor?.ratings && editor.ratings.length > 0) {
        this._logger.log(
          `Editor ratings for user ${editorId}: ${editor.ratings}`,
        );
        const specificRating = editor.ratings.find((rating) =>
          rating.userId.equals(userId),
        );
        if (specificRating) {
          this._logger.log(
            `Current rating of user ${userId} on editor ${editorId}: ${specificRating.rating}`,
          );
          return {
            rating: specificRating.rating,
            feedback: specificRating.feedback,
            userId: specificRating.userId.toString(), // Convert ObjectId to string
          };
        }
        this._logger.log(
          `No specific rating found for user ${userId} on editor ${editorId}`,
        );
        return null;
      }
      this._logger.log(`No ratings found for editor ${editorId}`);
      return null;
    } catch (error) {
      this._logger.error(
        `Error getting current editor rating: ${error.message}`,
      );
      throw error;
    }
  }

  async updateWorkPublicStatus(
    worksId: string,
    updateWorkPublicStatusDto: UpdateWorkPublicStatusDto,
  ): Promise<SuccessResponseDto> {
    try {
      return this._workService.updateWorkPublicStatus(
        worksId,
        updateWorkPublicStatusDto,
      );
    } catch (error) {
      this._logger.error(`Error updating work public status: ${error.message}`);
      throw error;
    }
  }

  async submitWorkFeedback(
    workId: Types.ObjectId,
    userId: Types.ObjectId,
    feedback: string,
  ): Promise<SuccessResponseDto> {
    const quotation = await this._quotationService.findOne({
      worksId: new Types.ObjectId(workId),
    });
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }
    if (quotation.userId.toString() !== userId.toString()) {
      throw new ForbiddenException(
        'You are not authorized to submit feedback for this work',
      );
    }

    await this._timelineService.create({
      quotationId: new Types.ObjectId(quotation._id),
      event: TimelineEvent.FEEDBACK_RECEIVED,
      userId: new Types.ObjectId(userId),
      editorId: new Types.ObjectId(quotation.editorId),
      message: feedback,
    });

    this._logger.log(`User ${userId} submitted feedback for work ${workId}`);
    return { success: true, message: 'Feedback submitted successfully' };
  }

  async markWorkAsSatisfied(
    workId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    const work = await this._workService.findById(workId);
    if (!work) {
      throw new NotFoundException('Work not found');
    }

    if (work.userId.toString() !== userId.toString()) {
      throw new ForbiddenException(
        'You are not authorized to mark this work as satisfied',
      );
    }

    if (work.isSatisfied) {
      throw new BadRequestException(
        'Work has already been marked as satisfied.',
      );
    }

    await this._workService.updateWork(workId, { isSatisfied: true });

    const quotation = await this._quotationService.findOne({ worksId: workId });
    if (!quotation) {
      this._logger.warn(
        `Could not find quotation for workId: ${workId} while marking as satisfied`,
      );
      return {
        success: true,
        message:
          'Work marked as satisfied, but timeline event could not be created.',
      };
    }

    await this._timelineService.create({
      quotationId: new Types.ObjectId(quotation._id),
      userId: new Types.ObjectId(userId),
      event: TimelineEvent.USER_SATISFIED,
      message: 'User marked the work as satisfied, completing the project.',
    });

    return { success: true, message: 'Work marked as satisfied successfully.' };
  }

  async getPublicWorks(
    params: GetPublicWorksQueryDto,
  ): Promise<PaginatedPublicWorksResponseDto> {
    try {
      this._logger.log(
        `Delegating getPublicWorks to WorksService with params: ${JSON.stringify(params)}`,
      );
      return this._workService.getPublicWorks(params);
    } catch (error) {
      this._logger.error(`Error getting public works: ${error.message}`);
      throw error;
    }
  }

  async getUser(userId: Types.ObjectId): Promise<UserBasicInfoDto | null> {
    try {
      const user = await this._userRepository.findById(userId);
      if (!user) {
        this._logger.log('User not found');
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      this._logger.error(`Error getting user: ${error.message}`);
      throw error;
    }
  }

  async payForWork(
    userId: Types.ObjectId,
    quotationId: Types.ObjectId,
    paymentDetails: {
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
      paymentType: PaymentType;
    },
  ): Promise<TransactionResponseDto> {
    return this._userQuotationService.payForWork(userId, quotationId, paymentDetails);
  }

  async getQuotationTransactions(quotationId: Types.ObjectId) {
    return this._transactionService.getTransactionsByQuotationId(
      quotationId.toString(),
    );
  }

  async getBidsByQuotation(
    quotationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<BidResponseDto[]> {
    return this._userQuotationService.getBidsByQuotation(quotationId, userId);
  }

  async acceptBid(
    bidId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<BidResponseDto> {
    return this._userQuotationService.acceptBid(bidId, userId);
  }

  async getAcceptedBid(
    quotationId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<Bid> {
    const bid = await this._bidsService.getAcceptedBid(quotationId, editorId);
    return bid;
  }

  async cancelAcceptedBid(
    bidId: Types.ObjectId,
    requesterId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    await this._bidsService.cancelAcceptedBid(bidId, requesterId);
    return { success: true, message: 'Bid cancelled successfully' };
  }

  async getEditorPublicProfile(
    editorId: string,
    currentUserId?: string,
  ): Promise<EditorPublicProfileResponseDto> {
    if (!Types.ObjectId.isValid(editorId)) {
      this._logger.log(`Invalid editor ID format: ${editorId}`);
      throw new BadRequestException('Invalid editor ID format.');
    }

    const editorObjectId = new Types.ObjectId(editorId);

    const editor =
      await this._editorService.getEditorUserCombined(editorObjectId);

    if (!editor || !editor.userId) {
      this._logger.log(`Editor with user ID ${editorId} not found.`);
      throw new NotFoundException(`Editor with user ID ${editorId} not found.`);
    }

    const user = editor.userId as unknown as User;

    const [followersCount, followingCount, isFollowing] = await Promise.all([
      this._relationshipService
        .getFollowers({ userId: editorObjectId, limit: 0, skip: 0 })
        .then((f) => f.length),
      this._relationshipService
        .getFollowing({ userId: editorObjectId, limit: 0, skip: 0 })
        .then((f) => f.length),
      currentUserId && Types.ObjectId.isValid(currentUserId)
        ? this._relationshipService.isFollowing(
            new Types.ObjectId(currentUserId),
            editorObjectId,
          )
        : Promise.resolve(false),
    ]);

    const averageRating = this._calculateAverageRating(editor.ratings);

    const sharedTutorials = (editor.sharedTutorials || [])
      .map(getYouTubeEmbedUrl)
      .filter((url) => url !== '');

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

  async getPublicEditors(
    params: GetPublicEditorsDto,
  ): Promise<PaginatedPublicEditorsDto> {
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
      matchStage.category = { $regex: category, $options: 'i' };
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
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

    pipeline.push({
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
    });

    const result = await this._editorService.getPublicEditors(pipeline);

    const data = result[0]?.data || [];
    const total = result[0]?.total.length > 0 ? result[0].total[0].count : 0;

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async reportUser(
    reportDto: ReportUserDto,
    reporterId: string,
  ): Promise<SuccessResponseDto> {
    try {
      return this._reportService.reportUser(reporterId, reportDto);
    } catch (error) {
      this._logger.error(`Error reporting user: ${error.message}`);
      throw error;
    }
  }

  async followUser(
    sourceUserId: Types.ObjectId,
    targetUserId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    try {
      await this._relationshipService.createRelationship({
        sourceUser: sourceUserId,
        targetUser: targetUserId,
        type: RelationshipType.FOLLOWS,
      });
      return { success: true, message: 'User followed successfully' };
    } catch (error) {
      this._logger.error(`Error following user: ${error.message}`);
      throw error;
    }
  }

  async unfollowUser(
    sourceUserId: Types.ObjectId,
    targetUserId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    try {
      await this._relationshipService.removeRelationship({
        sourceUser: sourceUserId,
        targetUser: targetUserId,
        type: RelationshipType.FOLLOWS,
      });
      return { success: true, message: 'User unfollowed successfully' };
    } catch (error) {
      this._logger.error(`Error unfollowing user: ${error.message}`);
      throw error;
    }
  }

  async getUserById(userId: Types.ObjectId): Promise<User | null> {
    return this._userRepository.findById(userId);
  }

  async blockUser(userId: Types.ObjectId): Promise<User | null> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this._userRepository.findOneAndUpdate(
      { _id: userId },
      { isBlocked: !user.isBlocked },
    );
  }

  async countAllUsers(): Promise<number> {
    return this._userRepository.countDocuments();
  }

  async getAllUsersForAdmin(
    query: GetAllUsersQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    const {
      page = '1',
      limit = '10',
      search,
      isEditor,
      gender,
      behaviourRating,
    } = query;

    const filter: FilterQuery<User> = {};
    if (isEditor !== undefined) filter.isEditor = isEditor;
    if (gender) filter.gender = gender;
    if (behaviourRating) filter.behaviourRating = behaviourRating;
    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await this._userRepository.countDocuments(filter);
    const users = await this._userRepository.getUsersForAdmin(
      filter,
      (parseInt(page) - 1) * parseInt(limit),
      parseInt(limit),
    );
    return { users, total };
  }

  async makeUserEditor(userId: Types.ObjectId): Promise<User | null> {
    try {
      return this._userRepository.findOneAndUpdate(
        { _id: userId },
        { isEditor: true },
      );
    } catch (error) {
      this._logger.error(`Error making user editor: ${error.message}`);
      throw error;
    }
  }

  async isExistingUser(userId: Types.ObjectId): Promise<boolean> {
    return this._userRepository.exists({ _id: userId });
  }
}
