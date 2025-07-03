import { ReportUserDto } from "src/users/dto/users.dto";
import { IReportRepository } from "../interfaces/reports.repository.interface";
import { InjectModel } from "@nestjs/mongoose";
import { Report, ReportDocument } from "../models/report.schema";
import { Model, Types } from "mongoose";

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
}