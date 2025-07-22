import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateBidDto } from 'src/common/bids/dto/create-bid.dto';
import {
  IBidService,
  IBidServiceToken,
} from 'src/common/bids/interfaces/bid.interfaces';
import { BidStatus } from 'src/common/bids/models/bids.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';

import {
  BidResponseDto,
  CreateEditorBidBodyDto,
  EditorBidDto,
  GetBiddedQuotationsQueryDto,
  PaginatedBiddedQuotationsResponseDto,
  UpdateEditorBidBodyDto,
} from '../dto/editors.dto';
import {
  IEditorRepository,
  IEditorRepositoryToken,
} from '../interfaces/editor.repository.interface';
import { IEditorBidService } from '../interfaces/services/editor-bid.service.interface';

@Injectable()
export class EditorBidService implements IEditorBidService {
  private readonly _logger = new Logger(EditorBidService.name);

  constructor(
    @Inject(IEditorRepositoryToken)
    private readonly _editorRepository: IEditorRepository,
    @Inject(IBidServiceToken) private readonly _bidsService: IBidService,
  ) {}

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
      await this._editorRepository.findByUserIdAndUpdate(editor.userId, {
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

  async getBiddedQuotations(
    editorId: Types.ObjectId,
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
}
