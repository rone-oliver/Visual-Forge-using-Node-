import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { FormattedEditor, GetEditorsQueryDto } from 'src/admins/dto/admin.dto';
import {
  IRelationshipService,
  IRelationshipServiceToken,
} from 'src/common/relationship/interfaces/service.interface';
import { calculateAverageRating } from 'src/common/utils/calculation.util';
import { EditorRequest } from 'src/editors/models/editorRequest.schema';
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
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import {
  IUsersService,
  IUsersServiceToken,
} from 'src/users/interfaces/services/users.service.interface';
import { UpdateWorkFilesDto } from 'src/works/dtos/works.dto';

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
} from '../dto/editors.dto';
import {
  IEditorRepository,
  IEditorRepositoryToken,
} from '../interfaces/editor.repository.interface';
import {
  IEditorBidService,
  IEditorBidServiceToken,
} from '../interfaces/services/editor-bid.service.interface';
import {
  IEditorRequestsService,
  IEditorRequestsServiceToken,
} from '../interfaces/services/editor-requests.service.interface';
import {
  IEditorWorkService,
  IEditorWorkServiceToken,
} from '../interfaces/services/editor-work.service.interface';
import { IEditorsService } from '../interfaces/services/editors.service.interface';
import { Editor } from '../models/editor.schema';

@Injectable()
export class EditorsService implements IEditorsService {
  private readonly _logger = new Logger(EditorsService.name);
  constructor(
    @Inject(IEditorRepositoryToken)
    private readonly _editorRepository: IEditorRepository,
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
    @Inject(IUsersServiceToken) private readonly _userService: IUsersService,
    @Inject(IRelationshipServiceToken)
    private readonly _relationshipService: IRelationshipService,
    @Inject(IEditorRequestsServiceToken)
    private readonly _editorRequestService: IEditorRequestsService,
    @Inject(IEditorBidServiceToken)
    private readonly _editorBidService: IEditorBidService,
    @Inject(IEditorWorkServiceToken)
    private readonly _editorWorkService: IEditorWorkService,
  ) {}

  // Editor Requests
  async getEditorRequests(): Promise<EditorRequest[]> {
    return this._editorRequestService.getEditorRequests();
  }

  async approveEditorRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
  ): Promise<boolean> {
    return this._editorRequestService.approveEditorRequest(requestId, adminId);
  }

  async rejectEditorRequest(
    requestId: Types.ObjectId,
    reason: string,
  ): Promise<boolean> {
    return this._editorRequestService.rejectEditorRequest(requestId, reason);
  }

  async countEditorRequests(): Promise<number> {
    return this._editorRequestService.countEditorRequests();
  }

  async checkEditorRequest(userId: Types.ObjectId): Promise<boolean> {
    return this._editorRequestService.checkEditorRequest(userId);
  }

  async deleteEditorRequest(
    userId: Types.ObjectId,
  ): Promise<EditorRequest | null> {
    return this._editorRequestService.deleteEditorRequest(userId);
  }

  async createEditorRequest(userId: Types.ObjectId): Promise<EditorRequest> {
    return this._editorRequestService.createEditorRequest(userId);
  }

  async findEditorRequest(
    userId: Types.ObjectId,
  ): Promise<EditorRequest | null> {
    return this._editorRequestService.findEditorRequest(userId);
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

  // Editor Works
  async uploadWorkFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<Omit<FileAttachmentDto, 'url'>[]> {
    return this._editorWorkService.uploadWorkFiles(files, folder);
  }

  async submitQuotationResponse(workData: SubmitWorkBodyDto) {
    return this._editorWorkService.submitQuotationResponse(workData);
  }

  async getCompletedWorks(
    editorId: Types.ObjectId,
  ): Promise<CompletedWorkDto[]> {
    return this._editorWorkService.getCompletedWorks(editorId);
  }

  async updateWorkFiles(
    workId: string,
    files: Express.Multer.File[],
    updateWorkFilesDto: UpdateWorkFilesDto,
  ): Promise<SuccessResponseDto> {
    return this._editorWorkService.updateWorkFiles(
      workId,
      files,
      updateWorkFilesDto,
    );
  }

  async createBid(
    editorId: Types.ObjectId,
    bidDto: CreateEditorBidBodyDto,
  ): Promise<BidResponseDto> {
    return this._editorBidService.createBid(editorId, bidDto);
  }

  async updateBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
    bidDto: UpdateEditorBidBodyDto,
  ): Promise<BidResponseDto> {
    return this._editorBidService.updateBid(bidId, editorId, bidDto);
  }

  async cancelAcceptedBid(
    bidId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    return this._editorBidService.cancelAcceptedBid(bidId, userId);
  }

  async deleteBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<void> {
    return this._editorBidService.deleteBid(bidId, editorId);
  }

  async getBiddedQuotations(
    editorId: Types.ObjectId,
    query: GetBiddedQuotationsQueryDto,
  ): Promise<PaginatedBiddedQuotationsResponseDto> {
    return this._editorBidService.getBiddedQuotations(editorId, query);
  }

  async getEditorBidForQuotation(
    quotationId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<EditorBidDto> {
    return this._editorBidService.getEditorBidForQuotation(
      quotationId,
      editorId,
    );
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

  async findMany(filter: FilterQuery<Editor>): Promise<Editor[] | null> {
    return this._editorRepository.findMany(filter);
  }
}
