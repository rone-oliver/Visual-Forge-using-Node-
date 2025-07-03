import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bid, BidDocument, BidStatus } from './models/bids.schema';
import { Model, Types } from 'mongoose';
import { Quotation, QuotationDocument, QuotationStatus } from '../../quotation/models/quotation.schema';
import { BidResponseDto } from './dto/bid-response.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventTypes } from '../constants/events.constants';
import { IBidRepository, IBidRepositoryToken, IBidService } from './interfaces/bid.interfaces';
import { SuccessResponseDto } from 'src/users/dto/users.dto';

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
export class BidsService implements IBidService{
  private readonly logger = new Logger(BidsService.name);
  constructor(
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
    @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
    @Inject(IBidRepositoryToken) private bidRepository: IBidRepository,
    private eventEmitter: EventEmitter2,
    // private quotationRepository: QuotationRepository,
  ) { };

  async create(createBidDto: CreateBidDto, editorId: Types.ObjectId): Promise<Bid> {
    try {
      // const quotation = await this.quotationRepository.findById(createBidDto.quotationId);
      const quotation = await this.quotationModel.findById(createBidDto.quotationId);
  
      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }
  
      if (quotation.status !== QuotationStatus.PUBLISHED) {
        throw new BadRequestException('Cannot bid on a quotation that is not published');
      }
  
      // Check if editor already has a bid for this quotation
      const existingBid = await this.bidRepository.findByFilters({
        quotationId: new Types.ObjectId(createBidDto.quotationId),
        editorId,
      });
  
      if (existingBid) {
        throw new BadRequestException('You have already placed a bid on this quotation');
      }
  
      const newBid = {
        ...createBidDto,
        quotationId: new Types.ObjectId(createBidDto.quotationId),
        editorId: new Types.ObjectId(editorId),
        dueDate: quotation.dueDate,
      };
  
      return this.bidRepository.create(newBid);
    } catch (error) {
      this.logger.error(`Failed to create bid: ${error.message}`, error.stack);
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error; // Re-throw NestJS exceptions
    }
    throw new InternalServerErrorException('Failed to create bid');
    }
  }

  async findAllByQuotation(quotationId: Types.ObjectId): Promise<BidResponseDto[]> {
    const bids = await this.bidRepository.findAllByQuotation(quotationId);

    return bids.map(bid => ({
      ...bid,
      _id: bid._id.toString(),
      quotationId: bid.quotationId.toString(),
      editorId: bid.editorId._id.toString(),
      editor: {
        _id: bid.editorId._id.toString(),
        fullname: bid.editorId.fullname,
        email: bid.editorId.email,
        profileImage: bid.editorId.profileImage
      }
    }));
  }

  async findAllByEditor(editorId: Types.ObjectId): Promise<Bid[]> {
    const bids = await this.bidRepository.findAllByEditor(editorId);
    this.logger.log(`Found ${bids.length} bids for editor ${editorId}`);
    return bids;
  }

  async acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId): Promise<Bid> {
    const session = await this.bidModel.db.startSession();
    session.startTransaction();

    try {
      const bid = await this.bidRepository.findById(bidId, { session });
  
      if (!bid) {
        throw new NotFoundException('Bid not found');
      }
  
      // const quotation = await this.quotationRepository.findById(
      //   bid.quotationId.toString(),
      //   { session }
      // );
      const quotation = await this.quotationModel.findById(bid.quotationId.toString());
  
      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }
  
      if (quotation.userId.toString() !== userId.toString()) {
        throw new BadRequestException('Only the quotation owner can accept bids');
      }
  
      if (quotation.status !== QuotationStatus.PUBLISHED) {
        throw new BadRequestException('Cannot accept bid on a quotation that is not published');
      }
  
      // Update quotation status and assign editor
      // await this.quotationRepository.updateOne(
      //   { _id: bid.quotationId },
      //   { status: QuotationStatus.ACCEPTED, editorId: bid.editorId },
      //   { session }
      // );
      await this.quotationModel.findByIdAndUpdate(
        bid.quotationId,
        { status: QuotationStatus.ACCEPTED, editorId: bid.editorId },
        { session }
      );
  
      // Reject all other bids for this quotation
      await this.bidRepository.updateMany(
        {
          quotationId: bid.quotationId,
          _id: { $ne: bidId }
        },
        { status: BidStatus.REJECTED },
        { session }
      );
  
      // Update this bid to accepted
      bid.status = BidStatus.ACCEPTED;
      const updateBid = await this.bidRepository.save(bid, { session });

      this.eventEmitter.emit(EventTypes.BID_ACCEPTED, {
        bidId: bid._id,
        quotationId: bid.quotationId,
        editorId: bid.editorId,
        userId,
        bidAmount: bid.bidAmount,
        title: quotation.title
      })

      await session.commitTransaction();
      return updateBid;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to accept bid: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAcceptedBid(quotationId: Types.ObjectId, editorId: Types.ObjectId): Promise<Bid> {
    const bid = await this.bidRepository.getAcceptedBid(quotationId, editorId);
    return bid;
  }

  async cancelAcceptedBid(bidId: Types.ObjectId, requesterId: Types.ObjectId): Promise<SuccessResponseDto> {
    const session = await this.bidModel.db.startSession();
    session.startTransaction();

    try {
      const acceptedBid = await this.bidRepository.findById(bidId, { session });

      if (!acceptedBid || acceptedBid.status !== BidStatus.ACCEPTED) {
        throw new BadRequestException('Bid to cancel must be an accepted bid.');
      }

      const quotation = await this.quotationModel.findById(acceptedBid.quotationId).session(session);

      if (!quotation) {
        throw new NotFoundException('Associated quotation not found.');
      }

      const isOwner = quotation.userId.toString() === requesterId.toString();
      const isEditor = acceptedBid.editorId.toString() === requesterId.toString();

      if (!isOwner && !isEditor) {
        throw new BadRequestException('Only the quotation owner or the accepted editor can cancel the bid.');
      }

      if (quotation.status !== QuotationStatus.ACCEPTED) {
        throw new BadRequestException('Quotation is not in an accepted state.');
      }
      
      if (quotation.isAdvancePaid) {
        throw new BadRequestException('Cannot cancel a bid after an advance payment has been made.');
      }

      await this.quotationModel.updateOne(
        { _id: quotation._id },
        { 
          status: QuotationStatus.PUBLISHED, 
          $unset: { editorId: 1 } 
        },
        { session }
      );

      acceptedBid.status = BidStatus.REJECTED;
      await this.bidRepository.save(acceptedBid, { session });

      await this.bidRepository.updateMany(
        {
          quotationId: quotation._id,
          _id: { $ne: acceptedBid._id },
          status: BidStatus.REJECTED
        },
        { status: BidStatus.PENDING },
        { session }
      );

      await session.commitTransaction();
      return { success: true, message: 'Bid cancelled successfully' };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to cancel accepted bid: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateBid(bidId: Types.ObjectId, editorId: Types.ObjectId, bidAmount: number, notes?:string):Promise<Bid>{
    const bid = await this.bidRepository.findById(bidId);

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.editorId.toString() !== editorId.toString()) {
      throw new BadRequestException('You can only update your own bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Cannot update a bid that has been accepted or rejected');
    }

    bid.bidAmount = bidAmount;
    bid.notes = notes || bid.notes;
    return await this.bidRepository.save(bid);
  }

  async deleteBid(bidId: Types.ObjectId, editorId: Types.ObjectId): Promise<void> {
    const bid = await this.bidRepository.findById(bidId);

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.editorId.toString() !== editorId.toString()) {
      throw new BadRequestException('You can only delete your own bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Cannot delete a bid that has been accepted or rejected');
    }

    await this.bidRepository.delete(bidId);
  }
}
