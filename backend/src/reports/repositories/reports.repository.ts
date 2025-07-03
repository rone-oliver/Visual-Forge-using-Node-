import { ReportUserDto } from "src/users/dto/users.dto";
import { IReportRepository } from "../interfaces/reports.repository.interface";
import { InjectModel } from "@nestjs/mongoose";
import { Report, ReportDocument, ReportStatus } from "../models/report.schema";
import { Model, Types } from "mongoose";
import { UpdateReportDto } from "../dtos/reports.dto";

export class ReportRepository implements IReportRepository {
    constructor(
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    ){}

    create(reporterId: string, reportDto: ReportUserDto): Promise<Report> {
        return this.reportModel.create({
            reporterId: new Types.ObjectId(reporterId),
            reportedUserId: new Types.ObjectId(reportDto.reportedUserId),
            context: reportDto.context.trim(),
            reason: reportDto.reason.trim(),
            additionalContext: reportDto.additionalContext?.trim(),
        })
    }

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