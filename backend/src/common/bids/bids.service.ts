import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bid, BidDocument, BidStatus } from '../models/bids.schema';
import { Model, Types } from 'mongoose';
import { Quotation, QuotationDocument, QuotationStatus } from '../models/quotation.schema';

@Injectable()
export class BidsService {
    constructor(
        @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
        @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
    ){};

    async create(createBidDto: Bid, editorId: string): Promise<Bid> {
        // Get the quotation to check if it's available and get the due date
        const quotation = await this.quotationModel.findById(createBidDto.quotationId);
        
        if (!quotation) {
          throw new NotFoundException('Quotation not found');
        }
    
        if (quotation.status !== QuotationStatus.PUBLISHED) {
          throw new BadRequestException('Cannot bid on a quotation that is not published');
        }
    
        // Check if editor already has a bid for this quotation
        const existingBid = await this.bidModel.findOne({
          quotationId: createBidDto.quotationId,
          editorId,
        });
    
        if (existingBid) {
          throw new BadRequestException('You have already placed a bid on this quotation');
        }
    
        // Create new bid with quotation due date for TTL
        const newBid = {
          ...createBidDto,
          quotationId: new Types.ObjectId(createBidDto.quotationId),
          editorId: new Types.ObjectId(editorId),
          dueDate: quotation.dueDate,
        };
    
        return this.bidModel.create(newBid);
      }

      async findAllByQuotation(quotationId: string): Promise<Bid[]> {
        return this.bidModel
          .find({ quotationId })
          .populate('editorId', 'name email profilePicture')
          .sort({ bidAmount: 1 }) // Sort by lowest bid first
          .exec();
      }

      async findAllByEditor(editorId: string): Promise<Bid[]> {
        return this.bidModel
          .find({ editorId })
          .populate('quotationId')
          .sort({ createdAt: -1 })
          .exec();
      }
    
      async acceptBid(bidId: string, userId: string): Promise<Bid> {
        const bid = await this.bidModel.findById(bidId);
        
        if (!bid) {
          throw new NotFoundException('Bid not found');
        }
    
        // Get the quotation to verify ownership
        const quotation = await this.quotationModel.findById(bid.quotationId.toString());
        
        if (!quotation) {
          throw new NotFoundException('Quotation not found');
        }
        
        if (quotation.userId.toString() !== userId) {
          throw new BadRequestException('Only the quotation owner can accept bids');
        }
    
        if (quotation.status !== QuotationStatus.PUBLISHED) {
          throw new BadRequestException('Cannot accept bid on a quotation that is not published');
        }
    
        // Update quotation status and assign editor
        await this.quotationModel.updateOne(
          { _id: bid.quotationId },
          { status: QuotationStatus.ACCEPTED, editorId: bid.editorId }
        );
    
        // Reject all other bids for this quotation
        await this.bidModel.updateMany(
          { 
            quotationId: bid.quotationId,
            _id: { $ne: bidId }
          },
          { status: BidStatus.REJECTED }
        );
    
        // Update this bid to accepted
        bid.status = BidStatus.ACCEPTED;
        return bid.save();
      }
    
      async deleteBid(bidId: string, editorId: string): Promise<void> {
        const bid = await this.bidModel.findById(bidId);
        
        if (!bid) {
          throw new NotFoundException('Bid not found');
        }
    
        if (bid.editorId.toString() !== editorId) {
          throw new BadRequestException('You can only delete your own bids');
        }
    
        if (bid.status !== BidStatus.PENDING) {
          throw new BadRequestException('Cannot delete a bid that has been accepted or rejected');
        }
    
        await this.bidModel.findByIdAndDelete(bidId);
      }
}
