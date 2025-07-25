import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  FilterQuery,
  Model,
  PipelineStage,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';

import {
  GetAcceptedQuotationsQueryDto,
  GetPublishedQuotationsQueryDto,
  getQuotationsByStatusResponseDto,
  PaginatedAcceptedQuotationsResponseDto,
  PaginatedPublishedQuotationsResponseDto,
  PublishedQuotationItemDto,
  TopQuotationByBidsDto,
  TopUserDto,
} from '../dtos/quotation.dto';
import { IQuotationRepository } from '../interfaces/quotation.repository.interface';
import {
  OutputType,
  Quotation,
  QuotationDocument,
  QuotationStatus,
} from '../models/quotation.schema';

@Injectable()
export class QuotationRepository implements IQuotationRepository {
  private readonly _logger = new Logger(QuotationRepository.name);
  constructor(
    @InjectModel(Quotation.name)
    private readonly _quotationModel: Model<QuotationDocument>,
  ) {}

  async create(quotation: Partial<Quotation>): Promise<Quotation> {
    return this._quotationModel.create(quotation);
  }

  async countDocuments(filter?: any): Promise<number> {
    return this._quotationModel.countDocuments(filter).exec();
  }

  async aggregate(pipeline: PipelineStage[]): Promise<any[]> {
    return this._quotationModel.aggregate(pipeline).exec();
  }

  async getQuotationsByStatus(): Promise<getQuotationsByStatusResponseDto[]> {
    return this._quotationModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async find(
    query: FilterQuery<Quotation>,
    projection: any = null,
    options?: QueryOptions,
  ): Promise<Quotation[] | null> {
    const result = await this._quotationModel
      .find(query, projection, options)
      .exec();
    return result.length > 0 ? result : null;
  }

  async findById(
    quotationId: Types.ObjectId,
    options?: QueryOptions,
  ): Promise<Quotation | null> {
    return this._quotationModel
      .findById(quotationId, null, { ...options, new: true })
      .exec();
  }

  async findOne(query: FilterQuery<Quotation>): Promise<Quotation | null> {
    return this._quotationModel.findOne(query).exec();
  }

  async findByIdAndUpdate(
    quotationId: Types.ObjectId,
    update: UpdateQuery<Quotation>,
    options?: QueryOptions,
  ): Promise<Quotation | null> {
    return this._quotationModel
      .findByIdAndUpdate(quotationId, update, { ...options, new: true })
      .exec();
  }

  async findByIdAndDelete(quotationId: Types.ObjectId): Promise<void> {
    await this._quotationModel.findByIdAndDelete(quotationId).exec();
  }

  async getCompletedQuotations(editorId: Types.ObjectId): Promise<Quotation[]> {
    return this._quotationModel
      .find({
        $or: [{ editorId }, { editorId: new Types.ObjectId(editorId) }],
        status: QuotationStatus.COMPLETED,
      })
      .populate('worksId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getCompletedQuotationsForUser(
    userId: Types.ObjectId,
  ): Promise<Quotation[] | null> {
    return this._quotationModel
      .find({
        $or: [{ userId }, { userId: new Types.ObjectId(userId) }],
        status: QuotationStatus.COMPLETED,
      })
      .populate('worksId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getPublishedQuotations(
    editorId: Types.ObjectId,
    query: GetPublishedQuotationsQueryDto,
  ) {
    const { page = 1, limit = 10, mediaType, searchTerm } = query;
    const skip = (page - 1) * limit;

    const matchStage: any = {
      status: QuotationStatus.PUBLISHED,
      userId: { $ne: new Types.ObjectId(editorId) },
    };

    if (mediaType && mediaType !== OutputType.MIXED && mediaType !== 'All') {
      matchStage.outputType = mediaType as OutputType;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $addFields: {
          convertedUserId: { $toObjectId: '$userId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          userFullName: '$userDetails.fullname',
        },
      },
    ];

    // Search stage (only if searchTerm is provided)
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { userFullName: { $regex: searchTerm, $options: 'i' } },
          ],
        },
      });
    }

    // Lookup for editor's bid
    pipeline.push(
      {
        $lookup: {
          from: 'bids',
          let: { quotation_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$quotationId', '$$quotation_id'] },
                    { $eq: ['$editorId', new Types.ObjectId(editorId)] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                bidId: '$_id',
                bidAmount: '$bidAmount',
                bidStatus: '$status',
                bidNotes: '$notes',
                bidCreatedAt: '$createdAt',
              },
            },
          ],
          as: 'editorBidDetails',
        },
      },
      {
        $addFields: {
          editorBid: { $arrayElemAt: ['$editorBidDetails', 0] },
        },
      },
    );

    // Facet for pagination and total count
    pipeline.push({
      $facet: {
        paginatedResults: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    return this._quotationModel.aggregate(pipeline).exec();
  }

  async getAcceptedQuotations(
    editorId: Types.ObjectId,
    query: GetAcceptedQuotationsQueryDto,
  ) {
    const { page = 1, limit = 10, searchTerm } = query;
    const skip = (page - 1) * limit;

    const matchStage: any = {
      status: QuotationStatus.ACCEPTED,
      $or: [{ editorId }, { editorId: new Types.ObjectId(editorId) }],
    };

    if (searchTerm) {
      matchStage.$and = [
        { $or: matchStage.$or },
        {
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
          ],
        },
      ];
      delete matchStage.$or;
    }

    const countPipeline = [
      {
        $match: matchStage,
      },
      {
        $count: 'totalItems',
      },
    ];

    const dataPipeline: any[] = [
      { $match: matchStage },
      { $sort: { dueDate: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $addFields: {
          convertedUserId: { $toObjectId: '$userId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'clientDetails',
        },
      },
      {
        $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          userFullName: '$clientDetails.fullname',
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          estimatedBudget: 1,
          theme: 1,
          outputType: 1,
          dueDate: 1,
          status: 1,
          isAdvancePaid: 1,
          isFullyPaid: 1,
          userId: 1,
          editorId: 1,
          userFullName: 1,
          imageUrl: 1,
          attachedFiles: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const result = await this._quotationModel.aggregate(dataPipeline);
    const totalItemsResult =
      await this._quotationModel.aggregate(countPipeline);
    return { result, totalItemsResult };
  }

  async findByRazorpayOrderId(orderId: string): Promise<Quotation | null> {
    return this._quotationModel.findOne({
      $or: [
        { advancePaymentOrderId: orderId },
        { balancePaymentOrderId: orderId },
      ],
    });
  }

  async findMany(query: FilterQuery<Quotation>): Promise<Quotation[] | null> {
    return this._quotationModel.find(query);
  }

  async getTopUsersByQuotationCount(limit: number): Promise<TopUserDto[]> {
    return this._quotationModel.aggregate([
      {
        $group: {
          _id: '$userId',
          quotationCount: { $sum: 1 },
        },
      },
      { $sort: { quotationCount: -1 } },
      { $limit: limit },
      {
        $addFields: {
          convertedUserId: { $toObjectId: '$_id' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: '$userDetails',
      },
      {
        $project: {
          _id: '$userDetails._id',
          fullname: '$userDetails.fullname',
          email: '$userDetails.email',
          quotationCount: 1,
        },
      },
    ]);
  }

  async getTopQuotationsByBidCount(
    limit: number,
  ): Promise<TopQuotationByBidsDto[]> {
    return this._quotationModel.aggregate([
      {
        $lookup: {
          from: 'bids',
          localField: '_id',
          foreignField: 'quotationId',
          as: 'bids',
        },
      },
      {
        $addFields: {
          bidCount: { $size: '$bids' },
        },
      },
      { $sort: { bidCount: -1 } },
      { $limit: limit },
      {
        $addFields: {
          convertedUserId: { $toObjectId: '$userId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: '$userDetails',
      },
      {
        $project: {
          _id: '$userDetails._id',
          title: 1,
          status: 1,
          bidCount: 1,
          user: {
            _id: '$userDetails._id',
            username: '$userDetails.username',
            fullname: '$userDetails.fullname',
            email: '$userDetails.email',
            profileImage: '$userDetails.profileImage',
          },
        },
      },
    ]);
  }
}
