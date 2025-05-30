import { Injectable, Inject, Logger, HttpException, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './models/user.schema';
import { Categories, EditorRequest, EditorRequestDocument } from 'src/common/models/editorRequest.schema';
import * as bcrypt from 'bcrypt';
import { Editor, EditorDocument } from 'src/editors/models/editor.schema';
import { Quotation, QuotationDocument, QuotationStatus } from 'src/common/models/quotation.schema';
import { CloudinaryService, FileUploadResult } from 'src/common/cloudinary/cloudinary.service';
import { CompletedWork } from 'src/common/interfaces/completed-word.interface';
import { Observable } from 'rxjs';
import { Works, WorksDocument } from 'src/common/models/works.schema';
import { PaymentStatus, PaymentType, Transaction, TransactionDocument } from 'src/common/models/transaction.schema';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/models/notification.schema';
import { Bid, BidDocument, BidStatus } from 'src/common/models/bids.schema';
import { BidsService } from 'src/common/bids/bids.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(EditorRequest.name) private editorRequestModel: Model<EditorRequestDocument>,
        @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
        @InjectModel(Works.name) private workModel: Model<WorksDocument>,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
        private cloudinaryService: CloudinaryService,
        private notificationService: NotificationService,
        private bidsService: BidsService,
    ) { }

    async findOne(filter: Partial<User>): Promise<User | null> {
        try {
            return this.userModel.findOne(filter).exec();
        } catch (error) {
            this.logger.error(`Error finding user: ${error.message}`);
            // throw error;
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    }

    async findByUsername(username: string) {
        return await this.userModel.findOne({ username });
    }

    async findByEmail(email: string) {
        return await this.userModel.findOne({ email });
    }

    async createUser(user: Partial<User>): Promise<User> {
        try {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            this.logger.log(`Creating new user: ${user.email}`);
            return this.userModel.create(user);
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    private async generateUniqueUsername(): Promise<string> {
        let isUnique = false;
        let username = '';

        while (!isUnique) {
            const randomString = Math.random().toString(36).substring(2, 6);
            username = `user_${randomString}`;

            const existingUser = await this.userModel.findOne({ username });
            if (!existingUser) {
                isUnique = true;
            }
        }
        return username;
    }

    async createGoogleUser(user: Partial<User>): Promise<User> {
        try {
            if (!user.username) {
                user.username = await this.generateUniqueUsername();
            }
            user.isVerified = true;
            return this.createUser(user);
        } catch (error) {
            this.logger.error(`Failed to create Google user: ${error.message}`);
            throw error;
        }
    }

    async updateUserGoogleId(userId: Types.ObjectId, googleId: string): Promise<User | null> {
        try {
            return await this.userModel.findOneAndUpdate({ _id: userId }, { $set: { googleId } }, { new: true })
        } catch (error) {
            this.logger.error(`Error updating user: ${error.message}`);
            throw error;
        }
    }

    async updateOne(filter: Partial<User>, update: Partial<User>) {
        try {
            await this.userModel.updateOne(filter, update);
            this.logger.log("User data updated successfully");
        } catch (error) {
            this.logger.error(`Error updating User: ${error.message}`);
            throw error;
        }
    }

    async updatePassword(userId: Types.ObjectId, password: string): Promise<boolean> {
        try {
            this.logger.log(userId, password)
            await this.userModel.updateOne({ _id: userId }, { $set: { password } });
            this.logger.log("Password updated successfully");
            return true;
        } catch (error) {
            this.logger.error(`Error updating password: ${error.message}`);
            throw error;
        }
    }

    async getUserDetails(userId: Types.ObjectId): Promise<User & { editorDetails?: any } | null> {
        try {
            this.logger.log(`Fetching user details for ID: ${userId}`);
            const user = await this.userModel.findById(userId);
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
            return user;
        } catch (error) {
            this.logger.error(`Error fetching user details: ${error.message}`);
            throw error;
        }
    }

    async getUsers(currentUserId: Types.ObjectId): Promise<User[]> {
        try {
            return await this.userModel.find({ _id: { $ne: currentUserId } });
        } catch (error) {
            this.logger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }

    async getUserInfoForChatList(userId: Types.ObjectId) {
        try {
            return await this.userModel.findById(userId, { username: 1, profileImage: 1, isOnline: 1 });
        } catch (error) {
            this.logger.error(`Error fetching user info for chat list: ${error.message}`);
            throw error;
        }
    }

    private calculateAverageRating(ratings: any[] | undefined): number {
        if (!ratings || ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    async requestForEditor(userId: Types.ObjectId): Promise<boolean> {
        try {

            const user = await this.userModel.findById(userId).select('isEditor');
            if (user && !user.isEditor) {
                this.logger.log(`User ${userId} is not an editor. Proceeding with request.`);
                await this.editorRequestModel.create({ userId });
                this.logger.log(`Editor request created for user ${userId}`);
                return true;
            }
            this.logger.log(`User ${userId} is already an editor or not found`);
            return false;
        } catch (error) {
            this.logger.error(`Error requesting editor role: ${error.message}`);
            return false;
        }
    }

    async getEditorRequestStatus(userId: Types.ObjectId): Promise<string | null> {
        try {
            const request = await this.editorRequestModel.findOne({ userId });
            if (request) {
                this.logger.log(`Editor request status for user ${userId}: ${request.status}`);
                return request.status;
            }
            return null;
        } catch (error) {
            this.logger.error(`Error fetching editor request status: ${error.message}`);
            throw error;
        }
    }

    async getQuotations(userId: Types.ObjectId): Promise<any[]> {
        try {
            const quotations = await this.quotationModel.find({ userId }).sort({ createdAt: -1 }).lean();
            return quotations;
        } catch (error) {
            this.logger.error(`Error fetching quotations: ${error}`);
            throw error;
        }
    }

    async createQuotation(quotation: Partial<Quotation>, userId: Types.ObjectId): Promise<Quotation> {
        try {
            this.logger.log(quotation)
            if (!quotation.dueDate) throw new Error('Due date is required');
            const advancePercentage = 0.4;
            const advanceAmount = Math.round((quotation.estimatedBudget || 0) * advancePercentage);
            const balanceAmount = (quotation.estimatedBudget || 0) - advanceAmount;
            quotation.advanceAmount = advanceAmount;
            quotation.balanceAmount = balanceAmount;
            quotation.userId = userId;
            const savedQuotation = await this.quotationModel.create(quotation);
            await this.notificationService.createNotification({
                userId,
                type: NotificationType.WORK,
                message: 'New quotation created',
                data: { title: savedQuotation.title },
                quotationId: savedQuotation._id
            });
            return savedQuotation;
        } catch (error) {
            this.logger.error(`Error creating quotation: ${error.message}`);
            throw error;
        }
    }

    async updateProfileImage(url: string, userId: Types.ObjectId) {
        try {
            await this.userModel.updateOne({ _id: userId }, { profileImage: url });
            return true;
        } catch (error) {
            this.logger.error(`Error updating profile image: ${error.message}`);
            throw error;
        }
    }

    async uploadFiles(files: Express.Multer.File[], folder?: string): Promise<FileUploadResult[]> {
        try {
            const uploadPromises = await this.cloudinaryService.uploadFiles(files, folder);
            return Promise.all(uploadPromises);
        } catch (error) {
            this.logger.error(`Error in uploadFiles: ${error.message}`);
            throw error;
        }
    }

    async updateProfile(editedData: any, userId: Types.ObjectId): Promise<boolean> {
        try {
            await this.userModel.updateOne({ _id: userId }, { $set: editedData })
            return true;
        } catch (error) {
            this.logger.error(`Error updating profile: ${error.message}`);
            throw error;
        }
    }

    async resetPassword(body: { currentPassword: string, newPassword: string }, userId: Types.ObjectId): Promise<boolean> {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) throw new Error('User not found');
            const isPasswordValid = await bcrypt.compare(body.currentPassword, user.password);
            if (!isPasswordValid) throw new Error('Current password is incorrect');
            const hashedPassword = await bcrypt.hash(body.newPassword, 10);
            await this.userModel.updateOne({ _id: userId }, { $set: { password: hashedPassword } });
            return true;
        } catch (error) {
            this.logger.error(`Error resetting password: ${error.message}`);
            throw error;
        }
    }

    async getCompletedWorks(userId: Types.ObjectId): Promise<CompletedWork[]> {
        try {
            const completedQuotations = await this.quotationModel
                .find({ userId, status: QuotationStatus.COMPLETED })
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
            this.logger.error(`Error fetching completed works: ${error}`);
            throw error;
        }
    }

    async rateWork(workId: string, rating: number, feedback: string): Promise<boolean> {
        try {
            this.logger.log('rating work:', workId, rating, feedback);
            const result = await this.workModel.updateOne({ _id: new Types.ObjectId(workId) }, { $set: { rating, feedback } });
            console.log('rating work success');
            if (result.matchedCount > 0 && result.modifiedCount > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            this.logger.error(`Error rating work: ${error.message}`);
            throw error;
        }
    }

    async rateEditor(editorId: string, rating: number, feedback: string, userId: Types.ObjectId): Promise<boolean> {
        try {
            this.logger.log('rating editor dto from service:', editorId, rating, feedback, userId);
            const result = await this.editorModel.updateOne({ userId: new Types.ObjectId(editorId) }, { $push: { ratings: { rating, feedback, userId } } });
            if (result.matchedCount > 0 && result.modifiedCount > 0) {
                this.logger.log('rating editor success');
                return true;
            } else {
                this.logger.log('rating editor failed');
                return false;
            }
        } catch (error) {
            this.logger.error(`Error rating editor: ${error.message}`);
            throw error;
        }
    }

    async getCurrentEditorRating(editorId: string, userId: Types.ObjectId) {
        try {
            const editor = await this.editorModel.findOne({ userId: new Types.ObjectId(editorId) }).select('ratings');
            if (editor?.ratings) {
                this.logger.log(`Editor ratings for user ${editorId}: ${editor.ratings}`);
                const rating = editor.ratings.find((rating: any) => rating.userId.equals(userId));
                if (rating) {
                    this.logger.log(`Current rating of user ${userId} on editor ${editorId}: ${rating.rating}`);
                    return rating;
                }
                return null;
            }
            return null;
        } catch (error) {
            this.logger.error(`Error getting current editor rating: ${error.message}`);
            throw error;
        }
    }

    async updateWorkPublicStatus(worksId: string, isPublic: boolean) {
        try {
            const result = await this.workModel.updateOne({ _id: new Types.ObjectId(worksId) }, { $set: { isPublic } });
            if (result.matchedCount > 0 && result.modifiedCount > 0) {
                this.logger.log('Work public status updated successfully');
                return true;
            } else {
                this.logger.log('Work public status update failed');
                return false;
            }
        } catch (error) {
            this.logger.error(`Error updating work public status: ${error.message}`);
            throw error;
        }
    }

    async getPublicWorks(
        page: number,
        limit: number,
        rating?: number,
        search?: string,
    ): Promise<{ works: Works[], total: number }> {
        try {
            this.logger.log(`getPublicWorks called with: page=${page}, limit=${limit}, rating=${rating}, search="${search}"`);

            const filter: any = { isPublic: true };

            if (rating !== undefined && rating !== null) {
                filter.rating = rating;
            }

            if (search && search.trim()) {
                const searchTerm = search.trim().toLowerCase();
                this.logger.log(`Searching for term: "${searchTerm}"`);

                // Find users and editors that match the search term
                const [matchingUsers, matchingEditors] = await Promise.all([
                    this.userModel.find({
                        fullname: { $regex: searchTerm, $options: 'i' }
                    }).select('_id').lean(),

                    this.editorModel.find({
                        fullname: { $regex: searchTerm, $options: 'i' }
                    }).select('_id').lean()
                ]);

                this.logger.log(`Found ${matchingUsers.length} matching users and ${matchingEditors.length} matching editors`);

                const userIds = matchingUsers.map(user => user._id.toString());
                const editorIds = matchingEditors.map(editor => editor._id.toString());

                // If we found matching users or editors, add them to the filter
                if (userIds.length > 0 || editorIds.length > 0) {
                    filter.$or = [];

                    if (userIds.length > 0) {
                        filter.$or.push({ userId: { $in: userIds } });
                    }

                    if (editorIds.length > 0) {
                        filter.$or.push({ editorId: { $in: editorIds } });
                    }
                } else if (search.trim()) {
                    // If search term was provided but no matches found, return empty results
                    this.logger.log(`No matching users or editors found for "${searchTerm}", returning empty results`);
                    return { works: [], total: 0 };
                }
            }

            this.logger.log(`Final filter: ${JSON.stringify(filter)}`);

            // Execute the query with pagination
            const [works, total] = await Promise.all([
                this.workModel.find(filter)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                this.workModel.countDocuments(filter)
            ]);

            this.logger.log(`Found ${works.length} works out of ${total} total`);
            return { works, total };
        } catch (error) {
            this.logger.error(`Error getting public works: ${error.message}`);
            throw error;
        }
    }

    async getUser(userId: Types.ObjectId): Promise<User> {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                this.logger.log('User not found');
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            this.logger.error(`Error getting user: ${error.message}`);
            throw error;
        }
    }

    async createTransaction(userId: Types.ObjectId, quotationId: Types.ObjectId, paymentDetails: {
        paymentId: string;
        orderId: string;
        amount: number;
        paymentType: PaymentType
    }) {
        try {
            const transaction = await this.transactionModel.create({
                userId,
                quotationId,
                ...paymentDetails,
                status: PaymentStatus.COMPLETED,
            });

            if (paymentDetails.paymentType === PaymentType.ADVANCE) {
                await this.quotationModel.updateOne(
                    { _id: quotationId },
                    { $set: { isAdvancePaid: true } }
                );
            } else {
                await this.quotationModel.updateOne(
                    { _id: quotationId },
                    { $set: { isFullyPaid: true } }
                );
            }

            return transaction;
        } catch (error) {
            this.logger.error(`Error updating quotation payment: ${error.message}`);
            throw error;
        }
    }

    async getQuotationTransactions(quotationId: Types.ObjectId) {
        return this.transactionModel.find({ quotationId })
            .sort({ createdAt: -1 })
            .exec();
    }

    async getBidsByQuotation(quotationId: Types.ObjectId, userId: Types.ObjectId){
        const quotation = await this.quotationModel.findOne({ _id: quotationId, userId: userId.toString() });
        if (!quotation) {
            throw new NotFoundException('Quotation not found or does not belong to you');
        }

        const bids = await this.bidsService.findAllByQuotation(quotation._id);
        return bids;
    }

    async getBidCountsForUserQuotations(userId: Types.ObjectId): Promise<{ [quotationId: string]: number }> {
        const quotations = await this.quotationModel.find({
            userId,
            status: QuotationStatus.PUBLISHED
        });

        const quotationIds = quotations.map(q => q._id);

        // Use aggregation to get bid counts for each quotation
        const bidCounts = await this.bidModel.aggregate([
            {
                $match: {
                    quotationId: { $in: quotationIds },
                    status: BidStatus.PENDING
                }
            },
            {
                $group: {
                    _id: '$quotationId',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to the expected format
        const result: { [quotationId: string]: number } = {};
        bidCounts.forEach(item => {
            result[item._id.toString()] = item.count;
        });

        // Ensure all quotations have an entry (even if 0)
        quotations.forEach(quotation => {
            const id = quotation._id.toString();
            if (!result[id]) {
                result[id] = 0;
            }
        });

        return result;
    }

    async acceptBid(bidId: Types.ObjectId, userId: Types.ObjectId): Promise<Bid> {
        const bid = await this.bidsService.acceptBid(bidId.toString(), userId.toString());

        // Get the quotation to send notification
        const quotation = await this.quotationModel.findById(bid.quotationId);

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }
        // Send notification to the editor
        await this.notificationService.createNotification({
            userId: bid.editorId,
            type: NotificationType.WORK,
            message: `Your bid on "${quotation.title}" has been accepted!`,
            data: {
                quotationId: quotation._id,
                bidId: bid._id,
                bidAmount: bid.bidAmount
            }
        });

        return bid;
    }
}
