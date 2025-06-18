import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/models/user.schema';
import { Admin, AdminDocument } from './models/admin.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EditorRequest, EditorRequestDocument, EditorRequestStatus } from 'src/common/models/editorRequest.schema';
import { Editor, EditorDocument } from 'src/editors/models/editor.schema';
import { IAdminsService } from './interfaces/admins.service.interface';
import { FormattedEditor, FormattedEditorRequest, GetAllUsersQueryDto, GetEditorsQueryDto, UpdateReportDto } from './dto/admin.dto';
import { Report, ReportDocument, ReportStatus } from 'src/common/models/report.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';

@Injectable()
export class AdminsService implements IAdminsService {
    private readonly logger = new Logger(AdminsService.name);

    constructor(
        @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(EditorRequest.name) private editorRequestModel: Model<EditorRequestDocument>,
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    ) { };

    async findOne(filter: Partial<Admin>): Promise<Admin | null> {
        try {
            return this.adminModel.findOne(filter).exec();
        } catch (error) {
            throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
        }
    }

    async createAdmin(adminData: any): Promise<Admin> {
        adminData.password = await bcrypt.hash(adminData.password, 10);
        return this.adminModel.create(adminData);
    }

    async getAllUsers(query: GetAllUsersQueryDto): Promise<User[]> {
        try {
            this.logger.log('Fetching users with query:', query);
            const filter: any = {};
            if (query.isEditor !== undefined) filter.isEditor = query.isEditor;
            if (query.gender) filter.gender = query.gender;
            if (query.behaviourRating) filter.behaviourRating = query.behaviourRating;
            if (query.search) filter.username = { $regex: query.search, $options: 'i' };
            return await this.userModel.find(filter);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new HttpException('No users found', HttpStatus.NOT_FOUND);
        }
    }

    async getEditorRequests(): Promise<FormattedEditorRequest[]> {
        try {
            const requests = await this.editorRequestModel.find({ status: EditorRequestStatus.PENDING }).populate('userId');

            return requests.map(request => {
                const user = request.userId as any;

                return {
                    _id: request._id,
                    userId: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    categories: request.categories,
                    createdAt: request.createdAt,
                    status: request.status,
                    reason: request.reason
                };
            });
        } catch (error) {
            this.logger.error(`Error fetching editor requests: ${error.message}`);
            throw new HttpException('No editor requests found', HttpStatus.NOT_FOUND);
        }
    }

    async approveRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<boolean> {
        try {
            const request = await this.editorRequestModel.findOneAndUpdate({ _id: requestId }, { status: EditorRequestStatus.APPROVED, approvedBy: adminId });
            if (request && request.userId) {
                await this.userModel.updateOne({ _id: request.userId }, { isEditor: true });
                await this.editorModel.create({ userId: new Types.ObjectId(request.userId), category: [request.categories] });
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error approving request: ${error.message}`);
            throw new HttpException('Failed to approve request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async rejectRequest(requestId: Types.ObjectId, reason: string): Promise<boolean> {
        try {
            const request = await this.editorRequestModel.findOneAndUpdate({ _id: requestId }, { status: EditorRequestStatus.REJECTED, reason });
            return request !== null;
        } catch (error) {
            this.logger.error(`Error rejecting request: ${error.message}`);
            throw new HttpException('Failed to reject request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getEditors(query: GetEditorsQueryDto): Promise<FormattedEditor[]> {
        try {
            this.logger.log('Fetching editor with these query:', query);

            const pipeline: any[] = [];

            const matchStage: any = {};

            const categoryFilters: string[] = [];
            if (query.video === 'true') categoryFilters.push('Video');
            if (query.image === 'true') categoryFilters.push('Image');
            if (query.audio === 'true') categoryFilters.push('Audio');

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
                            if: { $eq: [{ $size: "$ratings" }, 0] },
                            then: 0,
                            else: { $avg: "$ratings.rating" }
                        }
                    }
                }
            });

            // Filter by rating if specified
            if (query.rating) {
                pipeline.push({
                    $match: {
                        averageRating: { $gte: parseFloat(query.rating) }
                    }
                });
            }

            // Lookup to populate user data
            pipeline.push({
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            });

            // Unwind the user array
            pipeline.push({
                $unwind: '$userInfo'
            });

            // Filter by username search if specified
            if (query.search) {
                pipeline.push({
                    $match: {
                        'userInfo.username': { $regex: query.search, $options: 'i' }
                    }
                });
            }

            // Project to format the output
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
                    socialLinks: { $ifNull: ['$socialLinks', {}] }
                }
            });

            const editors = await this.editorModel.aggregate(pipeline);
            return editors as FormattedEditor[];
        } catch (error) {
            this.logger.error(`Error fetching editors: ${error.message}`);
            throw new HttpException('No editors found', HttpStatus.NOT_FOUND);
        }
    }

    async blockUser(userId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            // const user = await this.userModel.findByIdAndUpdate(userId, { isBlocked: true });
            const user = await this.userModel.findOne({ _id: userId });
            if (!user) {
                return { success: false, message: 'User not found' };
            }
            await this.userModel.findOneAndUpdate({ _id: user._id }, { isBlocked: !user.isBlocked })
            return {
                success: true,
                message: 'User blocked successfully'
            };
        } catch (error) {
            this.logger.error(`Error blocking user: ${error.message}`);
            throw new HttpException('Failed to block user', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getPendingReports(): Promise<Report[]> {
        return this.reportModel
            .find({ status: ReportStatus.PENDING })
            .populate('reporterId', 'username email')
            .populate('reportedUserId', 'username email isBlocked')
            .sort({ createdAt: -1 })
            .exec();
    }

    async updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report> {
        const report = await this.reportModel.findByIdAndUpdate(reportId, updateDto, { new: true });
        if (!report) {
            throw new NotFoundException(`Report with ID "${reportId}" not found`);
        }
        return report;
    }
}