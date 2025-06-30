import { HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from 'src/users/models/user.schema';
import { Admin } from './models/admin.schema';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { IAdminsService } from './interfaces/admins.service.interface';
import { DashboardResponseDto, FormattedEditor, FormattedEditorRequest, GetAllUsersQueryDto, GetEditorsQueryDto, UpdateReportDto } from './dto/admin.dto';
import { Report } from 'src/common/models/report.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { IAdminRepository, IAdminRepositoryToken } from './interfaces/admins.repository.interface';
import { IReportsRepository, IReportsRepositoryToken } from './interfaces/reports.repository.interface';
import { IQuotationService, IQuotationServiceToken } from 'src/quotation/interfaces/quotation.service.interface';
import { IEditorsService, IEditorsServiceToken } from 'src/editors/interfaces/editors.service.interface';
import { IUsersService, IUsersServiceToken } from 'src/users/interfaces/users.service.interface';

@Injectable()
export class AdminsService implements IAdminsService {
    private readonly logger = new Logger(AdminsService.name);

    constructor(
        @Inject(IUsersServiceToken) private readonly userService: IUsersService,
        @Inject(IEditorsServiceToken) private readonly editorService: IEditorsService,
        @Inject(IAdminRepositoryToken) private readonly adminRepository: IAdminRepository,
        @Inject(IReportsRepositoryToken) private readonly reportsRepository: IReportsRepository,
        @Inject(IQuotationServiceToken) private readonly quotationService: IQuotationService,
        @Inject(IUsersServiceToken) private readonly usersService: IUsersService,
    ) { };

    async findOne(filter: Partial<Admin>): Promise<Admin | null> {
        try {
            return this.adminRepository.findOne(filter);
        } catch (error) {
            throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
        }
    }

    async createAdmin(adminData: any): Promise<Admin> {
        adminData.password = await bcrypt.hash(adminData.password, 10);
        return this.adminRepository.create(adminData);
    }

    async getAllUsers(query: GetAllUsersQueryDto): Promise<User[]> {
        try {
            this.logger.log('Delegating to UsersService to fetch users');
            return this.usersService.getAllUsersForAdmin(query);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new HttpException('No users found', HttpStatus.NOT_FOUND);
        }
    }

    async getEditorRequests(): Promise<FormattedEditorRequest[]> {
        try {
            const requests = await this.editorService.getEditorRequests();

            return requests.map(request => {
                const user = request.userId as unknown as User;

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
            const success = await this.editorService.approveEditorRequest(requestId, adminId);
            return success ? true : false;
        } catch (error) {
            this.logger.error(`Error approving request: ${error.message}`);
            throw new HttpException('Failed to approve request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async rejectRequest(requestId: Types.ObjectId, reason: string): Promise<boolean> {
        try {
            const success = await this.editorService.rejectEditorRequest(requestId, reason);
            return success ? true : false;
        } catch (error) {
            this.logger.error(`Error rejecting request: ${error.message}`);
            throw new HttpException('Failed to reject request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getEditors(query: GetEditorsQueryDto): Promise<FormattedEditor[]> {
        try {
            this.logger.log('Delegating to EditorsService to fetch editors');
            return await this.editorService.getEditorsForAdmin(query);
        } catch (error) {
            this.logger.error(`Error fetching editors: ${error.message}`);
            throw new HttpException('No editors found', HttpStatus.NOT_FOUND);
        }
    }

    async blockUser(userId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            await this.userService.blockUser(userId)
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
        return this.reportsRepository.getPendingReports();
    }

    async updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report> {
        const report = await this.reportsRepository.updateReport(reportId, updateDto);
        if (!report) {
            throw new NotFoundException(`Report with ID "${reportId}" not found`);
        }
        return report;
    }

    async getDashboardData(): Promise<DashboardResponseDto> {
        try {
            const totalUsers = await this.userService.countAllUsers();
            const totalEditors = await this.editorService.countAllEditors();
            const totalReports = await this.reportsRepository.countDocuments();
            const totalEditorRequests = await this.editorService.countEditorRequests();
            const totalQuotations = await this.quotationService.countAllQuotations();

            const quotationsByStatus = await this.quotationService.getQuotationsByStatus();

            return {
                totalUsers,
                totalEditors,
                totalReports,
                totalEditorRequests,
                totalQuotations,
                quotationsByStatus: {
                    Published: quotationsByStatus.Published,
                    Accepted: quotationsByStatus.Accepted,
                    Completed: quotationsByStatus.Completed,
                    Expired: quotationsByStatus.Expired,
                    Cancelled: quotationsByStatus.Cancelled,
                }
            };
        } catch (error) {
            this.logger.error(`Error fetching dashboard data: ${error.message}`);
            throw new HttpException('Failed to fetch dashboard data', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}