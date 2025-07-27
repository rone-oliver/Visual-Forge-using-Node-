import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  ForbiddenException,
  forwardRef,
} from '@nestjs/common';
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
import { PaymentType } from 'src/common/transaction/models/transaction.schema';
import { CompletedWorkDto } from 'src/quotation/dtos/quotation.dto';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
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
  GetPublicWorksQueryDto,
  PaginatedPublicWorksResponseDto,
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
  IUserEditorService,
  IUserEditorServiceToken,
} from '../interfaces/services/user-editor.service.interface';
import {
  IUserProfileService,
  IUserProfileServiceToken,
} from '../interfaces/services/user-profile.service.interface';
import {
  IUserQuotationService,
  IUserQuotationServiceToken,
} from '../interfaces/services/user-quotation.service.interface';
import {
  IUsersService,
  UserInfoForChatListDto,
} from '../interfaces/services/users.service.interface';
import {
  IUserRepository,
  IUserRepositoryToken,
} from '../interfaces/users.repository.interface';
import { User } from '../models/user.schema';

@Injectable()
export class UsersService implements IUsersService {
  private readonly _logger = new Logger(UsersService.name);
  constructor(
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
    @Inject(IWorkServiceToken)
    private readonly _workService: IWorkService,
    @Inject(ITransactionServiceToken)
    private readonly _transactionService: ITransactionService,
    @Inject(IReportServiceToken)
    private readonly _reportService: IReportService,
    @Inject(forwardRef(() => IRelationshipServiceToken))
    private readonly _relationshipService: IRelationshipService,
    @Inject(ICloudinaryServiceToken)
    private readonly _cloudinaryService: ICloudinaryService,
    @Inject(IUserRepositoryToken)
    private readonly _userRepository: IUserRepository,
    @Inject(IBidServiceToken)
    private readonly _bidsService: IBidService,
    @Inject(IHashingServiceToken)
    private readonly _hashingService: IHashingService,
    @Inject(ITimelineServiceToken)
    private readonly _timelineService: ITimelineService,
    @Inject(IUserQuotationServiceToken)
    private readonly _userQuotationService: IUserQuotationService,
    @Inject(IUserProfileServiceToken)
    private readonly _userProfileService: IUserProfileService,
    @Inject(IUserEditorServiceToken)
    private readonly _userEditorService: IUserEditorService,
  ) {}

  async findOne(filter: Partial<User>): Promise<User | null> {
    return this._userProfileService.findOne(filter);
  }

  async findByUsername(username: string) {
    return this._userProfileService.findByUsername(username);
  }

  async findByEmail(email: string) {
    return this._userProfileService.findByEmail(email);
  }

  async createUser(user: Partial<User>): Promise<User> {
    return this._userProfileService.createUser(user);
  }

  async createGoogleUser(user: Partial<User>): Promise<User> {
    return this._userProfileService.createGoogleUser(user);
  }

  async updateUserGoogleId(
    userId: Types.ObjectId,
    googleId: string,
  ): Promise<User | null> {
    return this._userProfileService.updateUserGoogleId(userId, googleId);
  }

  async updateOne(
    filter: Partial<User>,
    update: Partial<User>,
  ): Promise<User | null> {
    return this._userProfileService.updateOne(filter, update);
  }

  async updatePassword(
    userId: Types.ObjectId,
    password: string,
  ): Promise<boolean> {
    return this._userProfileService.updatePassword(userId, password);
  }

  async getUserDetails(
    userId: Types.ObjectId,
  ): Promise<UserProfileResponseDto | null> {
    return this._userProfileService.getUserDetails(userId);
  }

  async getUsers(currentUserId: Types.ObjectId): Promise<UserBasicInfoDto[]> {
    return this._userProfileService.getUsers(currentUserId);
  }

  async getUserInfoForChatList(
    userId: Types.ObjectId,
  ): Promise<UserInfoForChatListDto> {
    return this._userProfileService.getUserInfoForChatList(userId);
  }

  getUploadSignature(): { timestamp: number, signature: string, uploadPreset: string } {
    return this._cloudinaryService.generateUploadSignature();
  }

  async updateProfileImage(
    userId: Types.ObjectId,
    profileImageUrl: string,
  ): Promise<UserBaseResponseDto | null> {
    return this._userProfileService.updateProfileImage(userId, profileImageUrl);
  }

  async updateProfile(
    userId: Types.ObjectId,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto | null> {
    return this._userProfileService.updateProfile(userId, updateProfileDto);
  }

  // User Editor Service methods
  async requestForEditor(userId: Types.ObjectId): Promise<SuccessResponseDto> {
    return this._userEditorService.requestForEditor(userId);
  }

  async getEditorRequestStatus(
    userId: Types.ObjectId,
  ): Promise<EditorRequestStatusResponseDto> {
    return this._userEditorService.getEditorRequestStatus(userId);
  }

  async getPublicEditors(
    params: GetPublicEditorsDto,
  ): Promise<PaginatedPublicEditorsDto> {
    return this._userEditorService.getPublicEditors(params);
  }

  async getEditorPublicProfile(
    editorId: string,
    currentUserId?: string,
  ): Promise<EditorPublicProfileResponseDto> {
    return this._userEditorService.getPublicEditorProfile(
      editorId,
      currentUserId,
    );
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

  async createQuotation(
    userId: Types.ObjectId,
    createQuotationDto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    return this._userQuotationService.createQuotation(
      userId,
      createQuotationDto,
    );
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
    return this._userQuotationService.updateQuotation(
      quotationId,
      userId,
      updateQuotationDto,
    );
  }

  async deleteQuotation(
    quotationId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    return this._userQuotationService.deleteQuotation(quotationId);
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
      return await this._workService.rateWork(workId, rateWorkDto);
    } catch (error) {
      this._logger.error(`Error rating work: ${error.message}`);
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
    return this._userProfileService.getUser(userId);
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
    return this._userQuotationService.payForWork(
      userId,
      quotationId,
      paymentDetails,
    );
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
    return this._userProfileService.findOne({ _id: userId });
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
    return this._userProfileService.isExistingUser(userId);
  }
}
