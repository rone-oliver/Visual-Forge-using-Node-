import { InjectModel } from "@nestjs/mongoose";
import { IReportsRepository } from "../interfaces/reports.repository.interface";
import { Model } from "mongoose";
import { Report, ReportDocument, ReportStatus } from "src/reports/models/report.schema";
import { UpdateReportDto } from "../dto/admin.dto";

export class ReportsRepository implements IReportsRepository {
    constructor(
        @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    ) { };

    async countDocuments(): Promise<number> {
        return this.reportModel.countDocuments().exec();
    }

    async getPendingReports(): Promise<Report[]> {
        return this.reportModel
            .find({ status: ReportStatus.PENDING })
            .populate('reporterId', 'username email')
            .populate('reportedUserId', 'username email isBlocked')
            .sort({ createdAt: -1 })
            .exec();
    }

    async updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report | null> {
        return this.reportModel.findByIdAndUpdate(reportId, updateDto, { new: true }).exec();
    }
}