import { Types } from 'mongoose';
import { User } from 'src/users/models/user.schema';
import { Admin } from '../models/admin.schema';
import { FormattedEditorRequest, GetAllUsersQueryDto, GetEditorsQueryDto, FormattedEditor, DashboardResponseDto } from '../dto/admin.dto';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { Report } from 'src/reports/models/report.schema';
import { UpdateReportDto } from 'src/reports/dtos/reports.dto';

export const IAdminsServiceToken = Symbol('IAdminsService');

export interface IAdminsService {
  findOne(filter: Partial<Admin>): Promise<Admin | null>;
  createAdmin(adminData: any): Promise<Admin>;
  getAllUsers(query: GetAllUsersQueryDto): Promise<{ users: User[]; total: number }>;
  getEditorRequests(): Promise<FormattedEditorRequest[]>;
  approveRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<boolean>;
  rejectRequest(requestId: Types.ObjectId, reason: string): Promise<boolean>;
  getEditors(query: GetEditorsQueryDto): Promise<{ editors: FormattedEditor[]; total: number }>;
  blockUser(userId: Types.ObjectId): Promise<SuccessResponseDto>;
  getPendingReports(): Promise<Report[]>;
  updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report>;
  getDashboardData(): Promise<DashboardResponseDto>;
}