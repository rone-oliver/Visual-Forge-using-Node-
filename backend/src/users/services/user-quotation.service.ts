import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import {
  IBidService,
  IBidServiceToken,
} from 'src/common/bids/interfaces/bid.interfaces';
import {
  ICloudinaryService,
  ICloudinaryServiceToken,
} from 'src/common/cloudinary/interfaces/cloudinary-service.interface';
import { EventTypes } from 'src/common/constants/events.constants';
import {
  ITransactionService,
  ITransactionServiceToken,
} from 'src/common/transaction/interfaces/transaction.service.interface';
import {
  PaymentStatus,
  PaymentType,
} from 'src/common/transaction/models/transaction.schema';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';
import { Quotation } from 'src/quotation/models/quotation.schema';
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
  BidResponseDto,
  CreateQuotationDto,
  GetQuotationsParamsDto,
  PaginatedQuotationsResponseDto,
  QuotationResponseDto,
  QuotationWithBidCountDto,
  SuccessResponseDto,
  TransactionResponseDto,
  UpdateQuotationDto,
} from '../dto/users.dto';
import { IUserQuotationService } from '../interfaces/services/user-quotation.service.interface';

@Injectable()
export class UserQuotationService implements IUserQuotationService {
  private readonly _logger = new Logger(UserQuotationService.name);

  constructor(
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
    @Inject(IBidServiceToken) private readonly _bidService: IBidService,
    @Inject(IAdminWalletServiceToken)
    private readonly _adminWalletService: IAdminWalletService,
    @Inject(ITransactionServiceToken)
    private readonly _transactionService: ITransactionService,
    @Inject(ICloudinaryServiceToken)
    private readonly _cloudinaryService: ICloudinaryService,
    @Inject(ITimelineServiceToken)
    private readonly _timelineService: ITimelineService,
    private _eventEmitter: EventEmitter2,
  ) {}

  async getQuotations(
    userId: Types.ObjectId,
    params: GetQuotationsParamsDto,
  ): Promise<PaginatedQuotationsResponseDto> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;
      const matchQuery: any = { userId: new Types.ObjectId(userId) };

      if (params.status && params.status !== 'All') {
        matchQuery.status = params.status;
      }
      if (params.searchTerm) {
        const searchRegex = { $regex: params.searchTerm, $options: 'i' };
        matchQuery.$or = [{ title: searchRegex }, { description: searchRegex }];
      }

      const totalItems =
        await this._quotationService.countQuotationsByFilter(matchQuery);
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
                  $expr: { $eq: ['$userId', '$$editorIdFromQuotation'] },
                },
              },
              {
                $project: {
                  userId: 1,
                  _id: 0,
                },
              },
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
                  $expr: { $eq: ['$_id', '$$userIdFromEditor'] },
                },
              },
              {
                $project: {
                  fullname: 1,
                  _id: 0,
                },
              },
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
                else: null,
              },
            },
          },
        },
        {
          $project: {
            bidsInfo: 0,
            editorInfo: 0,
            userInfo: 0,
          },
        },
        { $skip: skip },
        { $limit: limit },
      ];

      const quotations =
        await this._quotationService.aggregate(aggregationPipeline);
      this._logger.log(`quotations from getQuotations for user: `, quotations);

      return {
        quotations: quotations as QuotationWithBidCountDto[],
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      };
    } catch (error) {
      this._logger.error(`Error fetching quotations: ${error}`);
      throw error;
    }
  }

  async createQuotation(
    userId: Types.ObjectId,
    createQuotationDto: CreateQuotationDto,
  ): Promise<QuotationResponseDto> {
    try {
      this._logger.debug(createQuotationDto);
      let calculatedAdvanceAmount: number | undefined;
      let calculatedBalanceAmount: number | undefined;

      if (!createQuotationDto.dueDate) throw new Error('Due date is required');
      if (createQuotationDto.estimatedBudget) {
        const { advanceAmount, balanceAmount } =
          this._calculateQuotationAmounts(createQuotationDto.estimatedBudget);
        calculatedAdvanceAmount = advanceAmount;
        calculatedBalanceAmount = balanceAmount;
      }
      const quotationDataForDb = {
        ...createQuotationDto,
        userId: new Types.ObjectId(userId),
        advanceAmount: calculatedAdvanceAmount,
        balanceAmount: calculatedBalanceAmount,
        attachedFiles: createQuotationDto.attachedFiles?.map((file) => {
          const processedUniqueId = file.uniqueId
            ? String(file.uniqueId).replace(/ /g, '%20')
            : '';

          return {
            ...file,
            uniqueId: `${processedUniqueId}.${file.format}`,
            timestamp: file.timestamp,
            uploadedAt: new Date(),
          };
        }),
      };
      const savedQuotation =
        await this._quotationService.createQuotation(quotationDataForDb);

      this._eventEmitter.emit(EventTypes.QUOTATION_CREATED, {
        quotationId: savedQuotation._id.toString(),
        userId: userId.toString(),
        title: savedQuotation.title,
        amount: savedQuotation.estimatedBudget,
      });
      return savedQuotation as unknown as QuotationResponseDto;
    } catch (error) {
      this._logger.error(`Error creating quotation: ${error.message}`);
      throw error;
    }
  }

  async getQuotation(
    quotationId: Types.ObjectId,
  ): Promise<QuotationResponseDto | null> {
    try {
      const quotation = (await this._quotationService.findById(
        quotationId,
      )) as unknown as QuotationResponseDto;
      return quotation;
    } catch (error) {
      this._logger.error(`Error fetching quotation: ${error.message}`);
      throw error;
    }
  }

  async updateQuotation(
    quotationId: Types.ObjectId,
    userId: Types.ObjectId,
    updateQuotationDto: UpdateQuotationDto,
  ): Promise<QuotationResponseDto> {
    try {
      const { filesToDelete, ...updateData } = updateQuotationDto;

      const quotation = await this._quotationService.findById(quotationId);
      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }

      if (quotation.userId.toString() !== userId.toString()) {
        throw new ForbiddenException(
          'You are not authorized to update this quotation.',
        );
      }

      if (filesToDelete && filesToDelete.length > 0) {
        const idsToDelete = filesToDelete;
        const filesMarkedForDelete = quotation.attachedFiles.filter((file) =>
          idsToDelete.includes(file.uniqueId),
        );

        const deletePromises = filesMarkedForDelete.map((file) =>
          this._cloudinaryService.deleteFile(file.uniqueId, file.fileType),
        );

        try {
          await Promise.all(deletePromises); // If ANY promise in deletePromises rejects, this line will throw an error
          this._logger.log('Files deleted successfully');
          // This line only runs if ALL deletions succeed
          quotation.attachedFiles = quotation.attachedFiles.filter(
            (file) => !idsToDelete.includes(file.uniqueId),
          );
        } catch (error) {
          // If Promise.all rejects, the error will be caught here.
          this._logger.error(
            `One or more files failed to delete from Cloudinary. Original error: ${error.message}`,
          );
          // You might want to re-throw the error or handle it gracefully here
          throw error; // Propagate the error up if this method shouldn't continue
        }
      }
      const currentFiles = [...quotation.attachedFiles];

      if (updateData.attachedFiles && updateData.attachedFiles.length > 0) {
        this._logger.debug('attached files count: ', updateData.attachedFiles);
        currentFiles.push(...updateData.attachedFiles);
      }

      let advanceAmountCalc: number | undefined;
      let balanceAmountCalc: number | undefined;
      if (quotation.estimatedBudget) {
        const { advanceAmount, balanceAmount } =
          this._calculateQuotationAmounts(quotation.estimatedBudget);
        advanceAmountCalc = advanceAmount;
        balanceAmountCalc = balanceAmount;
      }
      const quotationDataForDb = {
        ...updateData,
        advanceAmount: advanceAmountCalc,
        balanceAmount: balanceAmountCalc,
        attachedFiles: currentFiles,
      };

      const updatedQuotation = (await this._quotationService.findByIdAndUpdate(
        quotationId,
        quotationDataForDb,
      )) as unknown as QuotationResponseDto;
      if (!updatedQuotation) {
        throw new InternalServerErrorException('Failed to update quotation.');
      }
      this._logger.debug('Quotation updated successfully', updatedQuotation);

      return updatedQuotation;
    } catch (error) {
      this._logger.error(`Error updating quotation: ${error.message}`);
      throw error;
    }
  }

  async deleteQuotation(
    quotationId: Types.ObjectId,
  ): Promise<SuccessResponseDto> {
    try {
      await this._quotationService.deleteQuotation(quotationId);
      return { success: true };
    } catch (error) {
      this._logger.error(`Error deleting quotation: ${error.message}`);
      throw error;
    }
  }

  async getBidsByQuotation(
    quotationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<BidResponseDto[]> {
    const quotation = await this._quotationService.findOne({
      _id: new Types.ObjectId(quotationId),
      userId: new Types.ObjectId(userId),
    });
    if (!quotation) {
      throw new NotFoundException(
        'Quotation not found or does not belong to you',
      );
    }

    const bids = await this._bidService.findAllByQuotation(quotation._id);
    return bids;
  }

  async acceptBid(
    bidId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<BidResponseDto> {
    const bid = await this._bidService.acceptBid(bidId, userId);

    const quotation = await this._quotationService.findById(bid.quotationId);

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    await this._timelineService.create({
      quotationId: new Types.ObjectId(quotation._id),
      event: TimelineEvent.EDITOR_ASSIGNED,
      userId: new Types.ObjectId(userId),
      editorId: new Types.ObjectId(quotation.editorId),
      message: 'Bid Accepted by the user',
    });

    return bid;
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
    try {
      const transaction = await this._transactionService.createTransaction({
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
        await this._quotationService.updateQuotation(
          { _id: quotationId },
          { $set: { isAdvancePaid: true } },
        );
      } else {
        await this._quotationService.updateQuotation(
          { _id: quotationId },
          { $set: { isFullyPaid: true } },
        );
      }
      const quotation = (await this._quotationService.updateQuotation(
        { _id: quotationId },
        { isPaymentInProgress: false },
      )) as Quotation;
      if (quotation.isFullyPaid) {
        await this._adminWalletService.recordUserPayment(
          quotation,
          paymentDetails.paymentId,
        );
        await this._timelineService.create({
          quotationId: new Types.ObjectId(quotationId),
          event: TimelineEvent.PAYMENT_COMPLETED,
          userId: new Types.ObjectId(userId),
          editorId: new Types.ObjectId(quotation.editorId),
          message: 'Final payment completed by user.',
        });
      }

      return transaction;
    } catch (error) {
      this._logger.error(`Error updating quotation payment: ${error.message}`);
      throw error;
    }
  }

  private _calculateQuotationAmounts(estimatedBudget: number): {
    advanceAmount: number;
    balanceAmount: number;
  } {
    const advanceAmount = estimatedBudget * 0.4;
    const balanceAmount = estimatedBudget * 0.6;
    return { advanceAmount, balanceAmount };
  }
}
