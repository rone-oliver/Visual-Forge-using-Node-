import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery, Types } from 'mongoose';
import { BiddedQuotationDto } from 'src/editors/dto/editors.dto';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
import { SuccessResponseDto } from 'src/users/dto/users.dto';

import { QuotationStatus } from '../../quotation/models/quotation.schema';
import { EventTypes } from '../constants/events.constants';

import { BidResponseDto } from './dto/bid-response.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import {
  IBidRepository,
  IBidRepositoryToken,
  IBidService,
} from './interfaces/bid.interfaces';
import { Bid, BidStatus } from './models/bids.schema';

interface PopulatedEditor {
  _id: Types.ObjectId;
  fullname: string;
  email: string;
  profileImage?: string;
}

interface PopulatedBid extends Omit<Bid, 'editorId'> {
  editorId: PopulatedEditor;
}

@Injectable()
export class BidsService implements IBidService {
  private readonly _logger = new Logger(BidsService.name);
  constructor(
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
    @Inject(IBidRepositoryToken)
    private readonly _bidRepository: IBidRepository,
    private _eventEmitter: EventEmitter2,
    @InjectConnection() private readonly _connection: Connection,
  ) {}

  async create(
    createBidDto: CreateBidDto,
    editorId: Types.ObjectId,
  ): Promise<Bid> {
    try {
      const quotation = await this._quotationService.findById(
        new Types.ObjectId(createBidDto.quotationId),
      );

      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }

      if (quotation.status !== QuotationStatus.PUBLISHED) {
        throw new BadRequestException(
          'Cannot bid on a quotation that is not published',
        );
      }

      // Check if editor already has a bid for this quotation
      const existingBid = await this._bidRepository.findByFilters({
        quotationId: new Types.ObjectId(createBidDto.quotationId),
        editorId,
      });

      if (existingBid) {
        throw new BadRequestException(
          'You have already placed a bid on this quotation',
        );
      }

      const newBid = {
        ...createBidDto,
        quotationId: new Types.ObjectId(createBidDto.quotationId),
        editorId: new Types.ObjectId(editorId),
        dueDate: quotation.dueDate,
      };

      return this._bidRepository.create(newBid);
    } catch (error) {
      this._logger.error(`Failed to create bid: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw NestJS exceptions
      }
      throw new InternalServerErrorException('Failed to create bid');
    }
  }

  async findAllByQuotation(
    quotationId: Types.ObjectId,
  ): Promise<BidResponseDto[]> {
    const bids = await this._bidRepository.findAllByQuotation(quotationId);

    return bids.map((bid) => ({
      ...bid,
      _id: bid._id.toString(),
      quotationId: bid.quotationId.toString(),
      editorId: bid.editorId._id.toString(),
      editor: {
        _id: bid.editorId._id.toString(),
        fullname: bid.editorId.fullname,
        email: bid.editorId.email,
        profileImage: bid.editorId.profileImage,
      },
    }));
  }

  async findAllByEditor(editorId: Types.ObjectId): Promise<Bid[]> {
    const bids = await this._bidRepository.findAllByEditor(editorId);
    this._logger.log(`Found ${bids.length} bids for editor ${editorId}`);
    return bids;
  }

  async acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId): Promise<Bid> {
    const session = await this._connection.startSession();
    session.startTransaction();

    try {
      const bid = await this._bidRepository.findById(bidId, { session });

      if (!bid) {
        throw new NotFoundException('Bid not found');
      }

      const quotation = await this._quotationService.findById(bid.quotationId);

      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }

      if (quotation.userId.toString() !== userId.toString()) {
        throw new BadRequestException(
          'Only the quotation owner can accept bids',
        );
      }

      if (quotation.status !== QuotationStatus.PUBLISHED) {
        throw new BadRequestException(
          'Cannot accept bid on a quotation that is not published',
        );
      }

      let advanceAmountCalc: number | undefined;
      let balanceAmountCalc: number | undefined;
      if (bid.bidAmount) {
        const { advanceAmount, balanceAmount } = this.calculateQuotationAmounts(
          bid.bidAmount,
        );
        advanceAmountCalc = advanceAmount;
        balanceAmountCalc = balanceAmount;
      }

      await this._quotationService.findByIdAndUpdate(
        bid.quotationId,
        {
          status: QuotationStatus.ACCEPTED,
          editorId: bid.editorId,
          estimatedBudget: bid.bidAmount,
          advanceAmount: advanceAmountCalc,
          balanceAmount: balanceAmountCalc,
        },
        { session },
      );

      // Reject all other bids for this quotation
      await this._bidRepository.updateMany(
        {
          quotationId: bid.quotationId,
          _id: { $ne: bidId },
        },
        { status: BidStatus.REJECTED },
        { session },
      );

      // Update this bid to accepted
      bid.status = BidStatus.ACCEPTED;
      const updateBid = await this._bidRepository.save(bid, { session });

      this._eventEmitter.emit(EventTypes.BID_ACCEPTED, {
        bidId: bid._id,
        quotationId: bid.quotationId,
        editorId: bid.editorId,
        userId,
        bidAmount: bid.bidAmount,
        title: quotation.title,
      });

      await session.commitTransaction();
      return updateBid;
    } catch (error) {
      await session.abortTransaction();
      this._logger.error(`Failed to accept bid: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // will move to util
  private calculateQuotationAmounts(estimatedBudget: number): {
    advanceAmount: number;
    balanceAmount: number;
  } {
    const advancePercentage = 0.4;
    const advanceAmount = Math.round(estimatedBudget * advancePercentage);
    const balanceAmount = estimatedBudget - advanceAmount;
    return { advanceAmount, balanceAmount };
  }

  async getAcceptedBid(
    quotationId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<Bid> {
    const bid = await this._bidRepository.getAcceptedBid(quotationId, editorId);
    return bid;
  }

  async cancelAcceptedBid(
    bidId: Types.ObjectId,
    requesterId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    const session = await this._connection.startSession();
    session.startTransaction();

    try {
      const acceptedBid = await this._bidRepository.findById(bidId, {
        session,
      });

      if (!acceptedBid || acceptedBid.status !== BidStatus.ACCEPTED) {
        throw new BadRequestException('Bid to cancel must be an accepted bid.');
      }

      const quotation = await this._quotationService.findById(
        acceptedBid.quotationId,
        { session },
      );

      if (!quotation) {
        throw new NotFoundException('Associated quotation not found.');
      }

      const isOwner = quotation.userId.toString() === requesterId.toString();
      const isEditor =
        acceptedBid.editorId.toString() === requesterId.toString();

      if (!isOwner && !isEditor) {
        throw new BadRequestException(
          'Only the quotation owner or the accepted editor can cancel the bid.',
        );
      }

      if (quotation.status !== QuotationStatus.ACCEPTED) {
        throw new BadRequestException('Quotation is not in an accepted state.');
      }

      if (quotation.isAdvancePaid) {
        throw new BadRequestException(
          'Cannot cancel a bid after an advance payment has been made.',
        );
      }

      await this._quotationService.findByIdAndUpdate(
        quotation._id,
        {
          status: QuotationStatus.PUBLISHED,
          $unset: { editorId: 1 },
        },
        { session },
      );

      acceptedBid.status = BidStatus.REJECTED;
      await this._bidRepository.save(acceptedBid, { session });

      await this._bidRepository.updateMany(
        {
          quotationId: quotation._id,
          _id: { $ne: acceptedBid._id },
          status: BidStatus.REJECTED,
        },
        { status: BidStatus.PENDING },
        { session },
      );

      await session.commitTransaction();
      return { success: true, message: 'Bid cancelled successfully' };
    } catch (error) {
      await session.abortTransaction();
      this._logger.error(
        `Failed to cancel accepted bid: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  async withdrawFromWork(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    const session = await this._connection.startSession();
    session.startTransaction();

    try {
      const acceptedBid = await this._bidRepository.findById(bidId, {
        session,
      });

      if (!acceptedBid || acceptedBid.status !== BidStatus.ACCEPTED) {
        throw new BadRequestException('Bid to cancel must be an accepted bid.');
      }

      const quotation = await this._quotationService.findById(
        acceptedBid.quotationId,
        { session },
      );

      if (!quotation) {
        throw new NotFoundException('Associated quotation not found.');
      }

      if (quotation.status !== QuotationStatus.ACCEPTED) {
        throw new BadRequestException('Quotation is not in an accepted state.');
      }

      await this._quotationService.findByIdAndUpdate(
        quotation._id,
        {
          status: QuotationStatus.PUBLISHED,
          $unset: { editorId: 1 },
        },
        { session },
      );

      acceptedBid.status = BidStatus.REJECTED;
      await this._bidRepository.save(acceptedBid, { session });

      await this._bidRepository.updateMany(
        {
          quotationId: quotation._id,
          _id: { $ne: acceptedBid._id },
          status: BidStatus.REJECTED,
        },
        { status: BidStatus.PENDING },
        { session },
      );

      await session.commitTransaction();
      return { success: true, message: 'Bid cancelled successfully' };
    } catch (error) {
      await session.abortTransaction();
      this._logger.error(
        'Error in withdrawing from current Accepted Quotation',
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
    bidAmount: number,
    notes?: string,
  ): Promise<Bid> {
    const bid = await this._bidRepository.findById(bidId);

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.editorId.toString() !== editorId.toString()) {
      throw new BadRequestException('You can only update your own bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException(
        'Cannot update a bid that has been accepted or rejected',
      );
    }

    bid.bidAmount = bidAmount;
    bid.notes = notes || bid.notes;
    return await this._bidRepository.save(bid);
  }

  async deleteBid(
    bidId: Types.ObjectId,
    editorId: Types.ObjectId,
  ): Promise<void> {
    const bid = await this._bidRepository.findById(bidId);

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.editorId.toString() !== editorId.toString()) {
      throw new BadRequestException('You can only delete your own bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException(
        'Cannot delete a bid that has been accepted or rejected',
      );
    }

    await this._bidRepository.delete(bidId);
  }

  async getBiddedQuotationsForEditor(
    pipeline: any,
  ): Promise<BiddedQuotationDto[]> {
    return await this._bidRepository.getBiddedQuotationsForEditor(pipeline);
  }

  async getBidsCountByAggregation(pipeline: any): Promise<number> {
    return await this._bidRepository.getBidsCountByAggregation(pipeline);
  }

  async findOne(filter: FilterQuery<Bid>): Promise<Bid | null> {
    return this._bidRepository.findOne(filter);
  }
}
