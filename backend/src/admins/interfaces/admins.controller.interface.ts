import { UpdateReportDto } from 'src/reports/dtos/reports.dto';
import { Report } from 'src/reports/models/report.schema';
import { SuccessResponseDto } from 'src/users/dto/users.dto';
import { User } from 'src/users/models/user.schema';

import {
  DashboardResponseDto,
  FormattedEditor,
  FormattedEditorRequest,
  GetAllUsersQueryDto,
  GetEditorsQueryDto,
} from '../dto/admin.dto';

export interface IAdminsController {
  getAllUsers(
    query: GetAllUsersQueryDto,
  ): Promise<{ users: User[]; total: number }>;
  getEditorRequests(): Promise<FormattedEditorRequest[]>;
  approveRequest(req: Request, reqId: string): Promise<boolean>;
  rejectRequest(reqId: string, body: { reason: string }): Promise<boolean>;
  getEditors(
    query: GetEditorsQueryDto,
  ): Promise<{ editors: FormattedEditor[]; total: number }>;
  blockUser(userId: string): Promise<SuccessResponseDto>;
  getPendingReports(): Promise<Report[]>;
  updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report>;
  getDashboardData(): Promise<DashboardResponseDto>;
}
