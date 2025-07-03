import { User } from "src/users/models/user.schema";
import { DashboardResponseDto, FormattedEditor, FormattedEditorRequest, GetAllUsersQueryDto, GetEditorsQueryDto, UpdateReportDto } from "../dto/admin.dto";
import { SuccessResponseDto } from "src/users/dto/users.dto";
import { Report } from "src/reports/models/report.schema";

export interface IAdminsController {
    getAllUsers(query: GetAllUsersQueryDto): Promise<User[]>;
    getEditorRequests(): Promise<FormattedEditorRequest[]>;
    approveRequest(req: Request, reqId: string): Promise<boolean>;
    rejectRequest(reqId: string, body: { reason: string }): Promise<boolean>;
    getEditors(query: GetEditorsQueryDto): Promise<FormattedEditor[]>;
    blockUser(userId: string): Promise<SuccessResponseDto>;
    getPendingReports(): Promise<Report[]>;
    updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report>;
    getDashboardData(): Promise<DashboardResponseDto>;
}