import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { FormattedEditor, GetEditorsQueryDto } from 'src/admins/dto/admin.dto';
import { CreateBidDto } from 'src/common/bids/dto/create-bid.dto';
import {
  IBidService,
  IBidServiceToken,
} from 'src/common/bids/interfaces/bid.interfaces';
import { BidStatus } from 'src/common/bids/models/bids.schema';
import {
  ICloudinaryService,
  ICloudinaryServiceToken,
} from 'src/common/cloudinary/interfaces/cloudinary-service.interface';
import { EventTypes } from 'src/common/constants/events.constants';
import {
  IRelationshipService,
  IRelationshipServiceToken,
} from 'src/common/relationship/interfaces/service.interface';
import { calculateAverageRating } from 'src/common/utils/calculation.util';
import { EditorRequest } from 'src/editors/models/editorRequest.schema';
import { NotificationType } from 'src/notification/models/notification.schema';
import {
  CompletedWorkDto,
  FileAttachmentDto,
  GetAcceptedQuotationsQueryDto,
  GetPublishedQuotationsQueryDto,
  PaginatedAcceptedQuotationsResponseDto,
  PaginatedPublishedQuotationsResponseDto,
} from 'src/quotation/dtos/quotation.dto';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
import { QuotationStatus } from 'src/quotation/models/quotation.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/users.service.interface';
import { UpdateWorkFilesDto } from 'src/works/dtos/works.dto';
import {
  IWorkService,
  IWorkServiceToken,
} from 'src/works/interfaces/works.service.interface';

import {
  SubmitWorkBodyDto,
  CreateEditorBidBodyDto,
  UpdateEditorBidBodyDto,
  EditorDetailsResponseDto,
  BidResponseDto,
  UserForEditorDetailsDto,
  EditorDetailsDto,
  AddTutorialDto,
  RemoveTutorialDto,
  GetBiddedQuotationsQueryDto,
  PaginatedBiddedQuotationsResponseDto,
  EditorBidDto,
} from './dto/editors.dto';
import {
  IEditorRepository,
  IEditorRepositoryToken,
} from './interfaces/editor.repository.interface';
import {
  IEditorRequestsRepository,
  IEditorRequestsRepositoryToken,
} from './interfaces/editorRequests.repository.interface';
import { IEditorsService } from './interfaces/editors.service.interface';
import { Editor } from './models/editor.schema';

@Injectable()
export class EditorsService implements IEditorsService {
  private readonly _logger = new Logger(EditorsService.name);
  constructor(
    @Inject(IEditorRepositoryToken)
    private readonly _editorRepository: IEditorRepository,
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
    @Inject(IWorkServiceToken) private readonly _worksService: IWorkService,
    @Inject(IUsersServiceToken) private readonly _userService: IUsersService,
    @Inject(IRelationshipServiceToken)
    private readonly _relationshipService: IRelationshipService,
    @Inject(ICloudinaryServiceToken)
    private readonly _cloudinaryService: ICloudinaryService,
    @Inject(IEditorRequestsRepositoryToken)
    private readonly _editorRequestsRepository: IEditorRequestsRepository,
    @Inject(IBidServiceToken) private readonly _bidsService: IBidService,
    private _eventEmitter: EventEmitter2,
  ) {}

  async getEditorRequests(): Promise<EditorRequest[]> {
    return this._editorRequestsRepository.getEditorRequests();
  }

  async approveEditorRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
  ): Promise<boolean> {
    try {
      const request = await this._editorRequestsRepository.approveEditorRequest(
        requestId,
        adminId,
      );
      if (request && request.userId) {
        await this._userService.makeUserEditor(request.userId);
        await this._editorRepository.create({
          userId: new Types.ObjectId(request.userId),
          category: [request.categories],
        });
        return true;
      }
      return false;
    } catch (error) {
      this._logger.error(`Error approving request: ${error.message}`);
      throw new HttpException(
        'Failed to approve request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectEditorRequest(
    requestId: Types.ObjectId,
    reason: string,
  ): Promise<boolean> {
    try {
      const request = await this._editorRequestsRepository.rejectEditorRequest(
        requestId,
        reason,
      );
      return request !== null;
    } catch (error) {
      this._logger.error(`Error rejecting request: ${error.message}`);
      throw new HttpException(
        'Failed to reject request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async countEditorRequests(): Promise<number> {
    return this._editorRequestsRepository.countEditorRequests();
  }

  async getEditorsForAdmin(
    query: GetEditorsQueryDto,
  ): Promise<{ editors: FormattedEditor[]; total: number }> {
    try {
      this._logger.log('Fetching editor with these query:', query);

      const {
        page = '1',
        limit = '10',
        // sortBy = 'fullname',
        // sortOrder = 'asc',
        search,
        video,
        image,
        audio,
        rating,
      } = query;

      const pipeline: any[] = [];

      const matchStage: any = {};

      const categoryFilters: string[] = [];
      if (video === 'true') categoryFilters.push('Video');
      if (image === 'true') categoryFilters.push('Image');
      if (audio === 'true') categoryFilters.push('Audio');

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
              if: { $eq: [{ $size: '$ratings' }, 0] },
              then: 0,
              else: { $avg: '$ratings.rating' },
            },
          },
        },
      });

      if (rating) {
        pipeline.push({
          $match: {
            averageRating: { $gte: parseFloat(rating) },
          },
        });
      }

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
        },
      });

      pipeline.push({ $unwind: '$userInfo' });

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { 'userInfo.fullname': { $regex: search, $options: 'i' } },
              { 'userInfo.email': { $regex: search, $options: 'i' } },
              { 'userInfo.username': { $regex: search, $options: 'i' } },
            ],
          },
        });
      }

      const countPipeline = [...pipeline, { $count: 'total' }];
      const totalResult = (await this._editorRepository.aggregate(
        countPipeline,
      )) as unknown as { total: number }[];
      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      // pipeline.push({
      //     $sort: {
      //         [`userInfo.${sortBy}`]: sortOrder === 'asc' ? 1 : -1,
      //     },
      // });

      pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
      pipeline.push({ $limit: parseInt(limit) });

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
          socialLinks: { $ifNull: ['$socialLinks', {}] },
        },
      });

      const editors = await this._editorRepository.aggregate(pipeline);

      return { editors: editors as unknown as FormattedEditor[], total };
    } catch (error) {
      this._logger.error(`Error fetching editors: ${error.message}`);
      throw new HttpException('No editors found', HttpStatus.NOT_FOUND);
    }
  }

  async countAllEditors(): Promise<number> {
    return this._editorRepository.countDocuments();
  }

  async getPublishedQuotations(
    editorId: Types.ObjectId,
    params: GetPublishedQuotationsQueryDto,
  ): Promise<PaginatedPublishedQuotationsResponseDto> {
    return this._quotationService.getPublishedQuotations(editorId, params);
  }

  async getAcceptedQuotations(
    editorId: Types.ObjectId,
    params: GetAcceptedQuotationsQueryDto,
  ): Promise<PaginatedAcceptedQuotationsResponseDto> {
    return this._quotationService.getAcceptedQuotations(editorId, params);
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
      // url: result.url,
      fileType: result.fileType, // Assuming FileType enum matches
      fileName: result.fileName,
      size: result.size,
      mimeType: result.mimeType,
      uploadedAt: result.uploadedAt,
      uniqueId: result.uniqueId,
      timestamp: result.timestamp,
      format: result.format,
    }));
  }

  async checkEditorRequest(userId: Types.ObjectId): Promise<boolean> {
    return this._editorRequestsRepository.checkEditorRequest(userId);
  }

  async deleteEditorRequest(
    userId: Types.ObjectId,
  ): Promise<EditorRequest | null> {
    return this._editorRequestsRepository.deleteRequest(userId);
  }

  async submitQuotationResponse(workData: SubmitWorkBodyDto) {
    try {
      const { quotationId, finalFiles, comments } = workData;
      const quotation = await this._quotationService.findById(
        new Types.ObjectId(quotationId),
      );
      if (!quotation) {
        this._logger.warn(`Quotation with ID ${quotationId} not found`);
        return false;
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
      return true;
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

  async getEditor(editorId: string): Promise<EditorDetailsResponseDto | null> {
    try {
      const user = await this._userService.getUserById(
        new Types.ObjectId(editorId),
      );
      if (user && user.isEditor) {
        this._logger.log('Fetching the editor details');
        const editorDetailsDoc =
          await this._editorRepository.findByUserIdAndLean(user._id);

        if (editorDetailsDoc) {
          this._logger.log('Editor details: ', editorDetailsDoc);
          const [followersCount, followingCount] = await Promise.all([
            this._relationshipService.getFollowerCount(user._id),
            this._relationshipService.getFollowingCount(user._id),
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
          this._logger.warn(
            `No editor sub-document found for user ID: ${user._id}`,
          );
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
      this._logger.error('Error getting the editor', error);
      throw new Error('Error getting the editor');
    }
  }

  async createBid(
    editorId: Types.ObjectId,
    bidDto: CreateEditorBidBodyDto,
  ): Promise<BidResponseDto> {
    const editor = await this._editorRepository.findByUserId(editorId);
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }

    if (
      editor.isSuspended &&
      editor.suspendedUntil &&
      new Date() > editor.suspendedUntil
    ) {
      await this.updateEditor(editor.userId, {
        $set: { isSuspended: false },
        $unset: { suspendedUntil: '' },
      });
      editor.isSuspended = false;
      editor.suspendedUntil = undefined;
    }

    if (editor.isSuspended) {
      const suspendedUntilDate = editor.suspendedUntil
        ? new Date(editor.suspendedUntil).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : 'an unknown date';
      throw new ForbiddenException(
        `Your account is suspended. You cannot bid on new quotations until ${suspendedUntilDate}.`,
      );
    }

    const { quotationId, bidAmount, notes } = bidDto;
    const bidData = {
      quotationId: new Types.ObjectId(quotationId),
      bidAmount,
      notes,
      status: BidStatus.PENDING,
    } as unknown as CreateBidDto;

    return await this._bidsService.create(bidData, editorId);
  }

  async updateBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
    bidDto: UpdateEditorBidBodyDto,
  ): Promise<BidResponseDto> {
    const { bidAmount, notes } = bidDto;
    const updatedBid = await this._bidsService.updateBid(
      bidId,
      editorId,
      bidAmount,
      notes,
    );
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

  async cancelAcceptedBid(
    bidId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    try {
      const editor = await this._editorRepository.findByUserId(userId);
      const currentDate = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(currentDate.getMonth() - 1);
      if (!editor) {
        throw new UnauthorizedException('Editor not found');
      }

      if (
        editor.lastWithdrawnDate &&
        new Date(editor.lastWithdrawnDate) > oneMonthAgo
      ) {
        this._logger.debug(
          'Editor is on cooldown period because of withdrawing limit',
        );
        throw new ConflictException(
          'You are currently in a cooldown period after a recent withdrawal',
        );
      }
      const bidResponse = await this._bidsService.withdrawFromWork(
        bidId,
        userId,
      );
      if (bidResponse.success) {
        await this._editorRepository.findByUserIdAndUpdate(userId, {
          $set: { lastWithdrawnDate: new Date() },
        });
      }
      return { success: true, message: 'Work withdrawing successful' };
    } catch (error) {
      this._logger.error('Error on cancelling acceptedBid');
      throw error;
    }
  }

  async deleteBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<void> {
    return this._bidsService.deleteBid(bidId, editorId);
  }

  async getEditorBidForQuotation(
    quotationId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<EditorBidDto> {
    const bid = await this._bidsService.findOne({
      quotationId,
      editorId,
    });

    if (!bid) {
      throw new NotFoundException(
        `Bid not found for quotation ${quotationId} by this editor.`,
      );
    }

    return {
      _id: bid._id.toString(),
      bidAmount: bid.bidAmount,
      bidNotes: bid.notes,
      bidStatus: bid.status,
      bidCreatedAt: bid.createdAt,
    };
  }

  async addTutorial(
    editorId: string,
    addTutorialDto: AddTutorialDto,
  ): Promise<Editor> {
    return this._editorRepository.addSharedTutorial(
      editorId,
      addTutorialDto.tutorialUrl,
    );
  }

  async removeTutorial(
    editorId: string,
    removeTutorialDto: RemoveTutorialDto,
  ): Promise<Editor> {
    return this._editorRepository.removeSharedTutorial(
      editorId,
      removeTutorialDto.tutorialUrl,
    );
  }

  async createEditorRequests(userId: Types.ObjectId): Promise<EditorRequest> {
    return this._editorRequestsRepository.create(userId);
  }

  async findEditorRequest(
    userId: Types.ObjectId,
  ): Promise<EditorRequest | null> {
    return this._editorRequestsRepository.findOne(userId);
  }

  async findByUserId(userId: Types.ObjectId): Promise<Editor | null> {
    return this._editorRepository.findByUserIdAndLean(userId);
  }

  async updateEditor(
    userId: Types.ObjectId,
    update: UpdateQuery<Editor>,
  ): Promise<Editor | null> {
    return this._editorRepository.findByUserIdAndUpdate(userId, update);
  }

  async getEditorRating(userId: Types.ObjectId): Promise<Editor | null> {
    return this._editorRepository.getEditorRating(userId);
  }

  async getEditorUserCombined(userId: Types.ObjectId): Promise<Editor | null> {
    return this._editorRepository.getEditorUserCombined(userId);
  }

  async getPublicEditors(pipeline: any[]): Promise<any[]> {
    return this._editorRepository.getPublicEditors(pipeline);
  }

  async getBiddedQuotations(
    editorId: string,
    query: GetBiddedQuotationsQueryDto,
  ): Promise<PaginatedBiddedQuotationsResponseDto> {
    const { page = 1, limit = 10, status, hideNonBiddable } = query;
    const skip = (page - 1) * limit;

    const matchStage: any = { editorId: new Types.ObjectId(editorId) };
    if (status) {
      matchStage.status = status;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'Quotations',
          localField: 'quotationId',
          foreignField: '_id',
          as: 'quotationInfo',
        },
      },
      { $unwind: '$quotationInfo' },
      {
        $addFields: {
          isQuotationBiddable: {
            $and: [
              { $ne: ['$quotationInfo.status', 'Completed'] },
              {
                $or: [
                  { $ne: ['$quotationInfo.status', 'Accepted'] },
                  {
                    $and: [
                      { $eq: ['$quotationInfo.status', 'Accepted'] },
                      { $eq: ['$quotationInfo.isAdvancePaid', false] },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ];

    if (hideNonBiddable) {
      pipeline.push({ $match: { isQuotationBiddable: true } });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const total =
      await this._bidsService.getBidsCountByAggregation(countPipeline);

    const dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: '$quotationInfo._id',
          title: '$quotationInfo.title',
          quotationStatus: '$quotationInfo.status',
          deadline: '$quotationInfo.dueDate',
          bidAmount: '$bidAmount',
          bidStatus: '$status',
          bidCreatedAt: '$createdAt',
          finalAmount: '$quotationInfo.finalAmount',
          acceptedEditorId: '$quotationInfo.editorId',
          isWorkAssignedToMe: {
            $eq: ['$quotationInfo.editorId', editorId],
          },
          isQuotationBiddable: '$isQuotationBiddable',
        },
      },
    ];

    const data =
      await this._bidsService.getBiddedQuotationsForEditor(dataPipeline);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findMany(filter: FilterQuery<Editor>): Promise<Editor[] | null> {
    return this._editorRepository.findMany(filter);
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
    try {
      // Get the editor's profile
      const editor = await this._editorRepository.findByUserId(editorId);
      if (!editor) {
        this._logger.warn(
          `Editor with ID ${editorId} not found or not an editor`,
        );
        return;
      }

      // Get the editor's most recent completed works
      const recentWorks = await this._worksService.getTwoRecentWorks(editorId);

      // Initialize score variables
      const scoreIncrement = 10; // Base score for completing a work
      let currentStreak = editor.streak || 0;
      let streakMultiplier = 1;

      // If this is not their first work
      if (recentWorks.length > 1) {
        const latestWork = recentWorks[0];
        const previousWork = recentWorks[1];

        // Calculate time difference in days
        const latestDate = new Date(latestWork.createdAt);
        const previousDate = new Date(previousWork.createdAt);
        const daysDifference = Math.floor(
          (latestDate.getTime() - previousDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // If completed within a week, increase streak
        if (daysDifference < 7) {
          currentStreak++;
          // Increase multiplier based on streak length
          streakMultiplier = Math.min(3, 1 + currentStreak * 0.1); // Cap at 3x
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
