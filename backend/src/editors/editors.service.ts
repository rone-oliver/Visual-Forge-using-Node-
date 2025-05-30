import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Editor, EditorDocument } from './models/editor.schema';
import { Model, Types } from 'mongoose';
import { IQuotation } from 'src/users/interface/Quotation.interface';
import { Quotation, QuotationDocument, QuotationStatus } from 'src/common/models/quotation.schema';
import { Observable } from 'rxjs';
import { CloudinaryService, FileUploadResult } from 'src/common/cloudinary/cloudinary.service';
import { Works, WorksDocument } from 'src/common/models/works.schema';
import { CompletedWork } from 'src/common/interfaces/completed-word.interface';
import { User, UserDocument } from 'src/users/models/user.schema';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/models/notification.schema';
import { Bid, BidDocument, BidStatus } from 'src/common/models/bids.schema';
import { BidsService } from 'src/common/bids/bids.service';

@Injectable()
export class EditorsService {
    private readonly logger = new Logger(EditorsService.name);
    constructor(
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
        @InjectModel(Works.name) private workModel: Model<WorksDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
        private cloudinaryService: CloudinaryService,
        private readonly notificationService: NotificationService,
        private readonly bidsService: BidsService,
    ) { };

    async createEditor(editor: Partial<Editor>): Promise<Editor> {
        return this.editorModel.create(editor);
    }
    private async getQuotations(userId: Types.ObjectId, status: QuotationStatus): Promise<IQuotation[] | undefined> {
        try {
            if (status === QuotationStatus.PUBLISHED) {
                return await this.quotationModel
                    .find({ status: QuotationStatus.PUBLISHED, userId: { $ne: userId } })
                    .sort({ createdAt: -1 })
                    .lean() as unknown as IQuotation[];
            }
            else if (status === QuotationStatus.ACCEPTED) {
                return await this.quotationModel
                    .find({ status: QuotationStatus.ACCEPTED, editorId: userId })
                    .sort({ createdAt: 1 })
                    .lean() as unknown as IQuotation[];
            }
        } catch (error) {
            this.logger.error('Error getting the quotations', error);
            throw new Error('Error getting the quotations');
        }
    }

    async getPublishedQuotations(userId: Types.ObjectId) {
        try {
            return await this.getQuotations(userId, QuotationStatus.PUBLISHED);
        } catch (error) {
            this.logger.error('Error getting the published quotations', error);
            throw new Error('Error getting the published quotations');
        }
    }

    async acceptQuotation(quotationId: string, editorId: Types.ObjectId): Promise<boolean> {
        try {
            const quotation = await this.quotationModel.findByIdAndUpdate(new Types.ObjectId(quotationId), { status: QuotationStatus.ACCEPTED, editorId },
                { new: true, runValidators: true }
            );
            if (!quotation) {
                this.logger.warn(`Quotation with ID ${quotationId} not found`);
                return false;
            }

            this.logger.log(`Quotation ${quotationId} accepted by editor ${editorId}`);
            return true;
        } catch (error) {
            this.logger.error('Error accepting the quotation ', error);
            throw new Error('Error accepting the quotation');
        }
    }

    async getAcceptedQuotations(editorId: Types.ObjectId) {
        try {
            return await this.getQuotations(editorId, QuotationStatus.ACCEPTED);
        } catch (error) {
            this.logger.error('Error getting the accepted quotations', error);
            throw new Error('Error getting the accepted quotations');
        }
    }

    async uploadWorkFiles(files: Express.Multer.File[], folder?: string): Promise<FileUploadResult[]> {
        try {
            const uploadPromises = await this.cloudinaryService.uploadFiles(files, folder);
            return Promise.all(uploadPromises);
        } catch (error) {
            this.logger.error(`Error in uploadFiles: ${error.message}`);
            throw error;
        }
    }

    async submitQuotationResponse(workData: any) {
        try {
            const { userId, quotationId, finalFiles, comments } = workData;
            const quotation = await this.quotationModel.findById(new Types.ObjectId(quotationId));
            if (!quotation) {
                this.logger.warn(`Quotation with ID ${quotationId} not found`);
                return false;
            }
            const work = await this.workModel.create({
                editorId: quotation.editorId,
                userId: quotation.userId,
                finalFiles,
                comments,
            });
            await this.quotationModel.findByIdAndUpdate(quotation._id, { status: QuotationStatus.COMPLETED, worksId: work._id });

            try {
                await this.notificationService.createNotification({
                    userId: quotation.userId,
                    type: NotificationType.WORK,
                    message: `Your work "${quotation.title}" has been completed`,
                    data: { title: quotation.title },
                    quotationId: quotation._id,
                    worksId: work._id
                });
                this.logger.log(`Notification sent to user ${quotation.userId} for completed work`);
            } catch (notificationError) {
                this.logger.error(`Failed to send notification: ${notificationError.message}`, notificationError.stack);
                // Continue execution even if notification fails
            }

            await this.updateEditorScore(quotation.editorId);
            return true;
        } catch (error) {
            this.logger.error('Error submitting the quotation response', error);
            throw new Error('Error submitting the quotation response');
        }
    }

    private async updateEditorScore(editorId: Types.ObjectId): Promise<void> {
        try {
            // Get the editor's profile
            const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) }).lean();
            if (!editor) {
                this.logger.warn(`Editor with ID ${editorId} not found or not an editor`);
                return;
            }

            // Get the editor's most recent completed works
            const recentWorks = await this.workModel
                .find({ editorId })
                .sort({ createdAt: -1 })
                .limit(2)
                .lean();

            // Initialize score variables
            let scoreIncrement = 10; // Base score for completing a work
            let currentStreak = editor.streak || 0;
            let streakMultiplier = 1;

            // If this is not their first work
            if (recentWorks.length > 1) {
                const latestWork = recentWorks[0];
                const previousWork = recentWorks[1];

                // Calculate time difference in days
                const latestDate = new Date(latestWork.createdAt);
                const previousDate = new Date(previousWork.createdAt);
                const daysDifference = Math.floor((latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

                // If completed within a week, increase streak
                if (daysDifference < 7) {
                    currentStreak++;
                    // Increase multiplier based on streak length
                    streakMultiplier = Math.min(3, 1 + (currentStreak * 0.1)); // Cap at 3x
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
            await this.editorModel.findOneAndUpdate({ userId: new Types.ObjectId(editorId) }, {
                score: newScore,
                streak: currentStreak
            });

            this.logger.log(`Updated editor ${editorId} score to ${newScore} (streak: ${currentStreak}, multiplier: ${streakMultiplier})`);
        } catch (error) {
            this.logger.error('Error updating editor score', error);
            // Don't throw error to prevent disrupting the main workflow
        }
    }

    async getCompletedWorks(editorId: Types.ObjectId): Promise<CompletedWork[]> {
        try {
            const completedQuotations = await this.quotationModel
                .find({ editorId, status: QuotationStatus.COMPLETED })
                .populate('worksId')
                .sort({ createdAt: -1 })
                .lean();

            return completedQuotations.map(quotation => {
                const worksData = quotation.worksId as any || {};
                const { worksId, ...quotationData } = quotation;
                return {
                    ...quotationData,
                    ...worksData,
                    quotationId: quotation._id,
                    worksId: worksData._id || null,
                    finalFiles: worksData.finalFiles || [],
                    attachedFiles: quotationData.attachedFiles || [],
                    comments: worksData.comments || '',
                    completedAt: worksData.createdAt,
                } as CompletedWork;
            })
        } catch (error) {
            this.logger.error('Error getting the completed works', error);
            throw new Error('Error getting the completed works');
        }
    }

    private calculateAverageRating(ratings: any[] | undefined): number {
        if (!ratings || ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    async getEditor(editorId: string): Promise<User & { editorDetails?: any } | null> {
        try {
            const user = await this.userModel.findById(new Types.ObjectId(editorId));
            if (user && user.isEditor) {
                this.logger.log('Fetching the editor details');
                console.log('user id: ', user._id);
                const editorDetails = await this.editorModel.findOne({ userId: user._id }).lean();
                if (editorDetails) {
                    this.logger.log('Editor details: ', editorDetails)
                    const userObj = user.toObject();
                    return {
                        ...userObj,
                        editorDetails: {
                            category: editorDetails.category || [],
                            score: editorDetails.score || 0,
                            ratingsCount: editorDetails.ratings?.length || 0,
                            averageRating: this.calculateAverageRating(editorDetails.ratings),
                            socialLinks: editorDetails.socialLinks || {},
                            createdAt: editorDetails.createdAt,
                        }
                    }
                } else console.log('no editor details');
            }
            return null;
        } catch (error) {
            this.logger.error('Error getting the editor', error);
            throw new Error('Error getting the editor');
        }
    }

    async createBid(
        quotationId: Types.ObjectId,
        editorId: Types.ObjectId,
        bidAmount: number,
        notes?: string
    ): Promise<Bid> {
        // Check if quotation exists and is in Published status
        const bidData = {
            quotationId,
            editorId,
            bidAmount,
            notes,
            status: BidStatus.PENDING
        } as Bid;

        return this.bidsService.create(bidData, editorId);
    }

    async getEditorBids(editorId: Types.ObjectId): Promise<Bid[]> {
        return this.bidsService.findAllByEditor(editorId);
    }

    async updateBid(bidId: Types.ObjectId, editorId: Types.ObjectId, bidAmount: number, notes?: string): Promise<Bid> {
        return this.bidsService.updateBid(bidId, editorId, bidAmount, notes);
    }

    async deleteBid(bidId: Types.ObjectId, editorId: Types.ObjectId): Promise<void> {
        return this.bidsService.deleteBid(bidId, editorId);
    }
}
