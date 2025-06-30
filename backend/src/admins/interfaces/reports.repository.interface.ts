import { Report } from "src/common/models/report.schema";
import { UpdateReportDto } from "../dto/admin.dto";

export const IReportsRepositoryToken = Symbol('IReportsRepository');

export interface IReportsRepository {
    countDocuments(): Promise<number>;
    getPendingReports(): Promise<Report[]>;
    updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report | null>;
}