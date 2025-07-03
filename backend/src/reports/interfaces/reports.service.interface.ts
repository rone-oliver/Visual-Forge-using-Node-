import { Report } from "../models/report.schema";
import { UpdateReportDto } from "../dtos/reports.dto";
import { ReportUserDto, SuccessResponseDto } from "src/users/dto/users.dto";

export const IReportServiceToken = Symbol('IReportService');

export interface IReportService {
    reportUser(reporterId: string, reportDto: ReportUserDto): Promise<SuccessResponseDto>;
    getPendingReports(): Promise<Report[]>;
    updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report | null>;
    countDocuments(): Promise<number>;
}