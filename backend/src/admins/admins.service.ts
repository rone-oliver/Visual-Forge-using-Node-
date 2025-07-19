import { HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from 'src/users/models/user.schema';
import { Admin } from './models/admin.schema';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { IAdminsService } from './interfaces/admins.service.interface';
import { DashboardResponseDto, FormattedEditor, FormattedEditorRequest, GetAllUsersQueryDto, GetEditorsQueryDto } from './dto/admin.dto';
import { Report } from 'src/reports/models/report.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { IAdminRepository, IAdminRepositoryToken } from './interfaces/admins.repository.interface';
import { IQuotationService, IQuotationServiceToken } from 'src/quotation/interfaces/quotation.service.interface';
import { IEditorsService, IEditorsServiceToken } from 'src/editors/interfaces/editors.service.interface';
import { IUsersService, IUsersServiceToken } from 'src/users/interfaces/users.service.interface';
import { IReportService, IReportServiceToken } from 'src/reports/interfaces/reports.service.interface';
import { IAdminWalletService, IAdminWalletServiceToken } from 'src/wallet/interfaces/admin-wallet.service.interface';
import { UpdateReportDto } from 'src/reports/dtos/reports.dto';
import { IWorkService, IWorkServiceToken } from 'src/works/interfaces/works.service.interface';

@Injectable()
export class AdminsService implements IAdminsService {
    private readonly _logger = new Logger(AdminsService.name);

    constructor(
        @Inject(IUsersServiceToken) private readonly _userService: IUsersService,
        @Inject(IEditorsServiceToken) private readonly _editorService: IEditorsService,
        @Inject(IAdminRepositoryToken) private readonly _adminRepository: IAdminRepository,
        @Inject(IReportServiceToken) private readonly _reportsService: IReportService,
        @Inject(IQuotationServiceToken) private readonly _quotationService: IQuotationService,
        @Inject(IAdminWalletServiceToken) private readonly _adminWalletService: IAdminWalletService,
        @Inject(IWorkServiceToken) private readonly _worksService: IWorkService,
    ) { };

    async findOne(filter: Partial<Admin>): Promise<Admin | null> {
        try {
            return this._adminRepository.findOne(filter);
        } catch (error) {
            throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
        }
    }

    async createAdmin(adminData: any): Promise<Admin> {
        adminData.password = await bcrypt.hash(adminData.password, 10);
        return this._adminRepository.create(adminData);
    }

    async getAllUsers(
        query: GetAllUsersQueryDto,
    ): Promise<{ users: User[]; total: number }> {
        try {
            this._logger.log('Delegating to UsersService to fetch users');
            return await this._userService.getAllUsersForAdmin(query);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new HttpException('No users found', HttpStatus.NOT_FOUND);
        }
    }

    async getEditorRequests(): Promise<FormattedEditorRequest[]> {
        try {
            const requests = await this._editorService.getEditorRequests();

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
            this._logger.error(`Error fetching editor requests: ${error.message}`);
            throw new HttpException('No editor requests found', HttpStatus.NOT_FOUND);
        }
    }

    async approveRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<boolean> {
        try {
            const success = await this._editorService.approveEditorRequest(requestId, adminId);
            return success ? true : false;
        } catch (error) {
            this._logger.error(`Error approving request: ${error.message}`);
            throw new HttpException('Failed to approve request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async rejectRequest(requestId: Types.ObjectId, reason: string): Promise<boolean> {
        try {
            const success = await this._editorService.rejectEditorRequest(requestId, reason);
            return success ? true : false;
        } catch (error) {
            this._logger.error(`Error rejecting request: ${error.message}`);
            throw new HttpException('Failed to reject request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getEditors(
        query: GetEditorsQueryDto,
    ): Promise<{ editors: FormattedEditor[]; total: number }> {
        try {
            this._logger.log('Delegating to EditorsService to fetch editors');
            return await this._editorService.getEditorsForAdmin(query);
        } catch (error) {
            this._logger.error(`Error fetching editors: ${error.message}`);
            throw new HttpException('No editors found', HttpStatus.NOT_FOUND);
        }
    }

    async blockUser(userId: Types.ObjectId): Promise<SuccessResponseDto> {
        try {
            await this._userService.blockUser(userId)
            return {
                success: true,
                message: 'User blocked successfully'
            };
        } catch (error) {
            this._logger.error(`Error blocking user: ${error.message}`);
            throw new HttpException('Failed to block user', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getPendingReports(): Promise<Report[]> {
        return this._reportsService.getPendingReports();
    }

    async updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report> {
        const report = await this._reportsService.updateReport(reportId, updateDto);
        if (!report) {
            throw new NotFoundException(`Report with ID "${reportId}" not found`);
        }
        return report;
    }

    async getDashboardData(): Promise<DashboardResponseDto> {
        try {
            const [
                totalUsers, totalEditors, totalEditorRequests, totalReports, 
                totalQuotations, transactionCounts, financialSummary, topUsersByQuotations, 
                topEditorsByCompletedWorks, topQuotationsByBids, quotationsByStatus,
            ] = await Promise.all([
                this._userService.countAllUsers(),
                this._editorService.countAllEditors(),
                this._editorService.countEditorRequests(),
                this._reportsService.countDocuments(),
                this._quotationService.countAllQuotations(),
                this._adminWalletService.getTransactionCountByFlow(),
                this._adminWalletService.getFinancialSummary(),
                this._quotationService.getTopUsersByQuotationCount(5),
                this._worksService.getTopEditorsByCompletedWorks(5),
                this._quotationService.getTopQuotationsByBidCount(5),
                this._quotationService.getQuotationsByStatus(),
            ]);

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
                },
                transactionCounts,
                financialSummary,
                topUsersByQuotations,
                topEditorsByCompletedWorks,
                topQuotationsByBids,
            };
        } catch (error) {
            this._logger.error(`Error fetching dashboard data: ${error.message}`);
            throw new HttpException('Failed to fetch dashboard data', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}