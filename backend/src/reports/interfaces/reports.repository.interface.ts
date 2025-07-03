import { ReportUserDto } from "src/users/dto/users.dto";
import { Report } from "../models/report.schema";
import { UpdateReportDto } from "../dtos/reports.dto";

export const IReportRepositoryToken = Symbol('IReportRepository');

export interface IReportRepository {
    create(reporterId: string, reportDto: ReportUserDto): Promise<Report>;
    countDocuments(): Promise<number>;
        getPendingReports(): Promise<Report[]>;
        updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report | null>;
}