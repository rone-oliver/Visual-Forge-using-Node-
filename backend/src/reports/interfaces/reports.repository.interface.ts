import { ReportUserDto } from "src/users/dto/users.dto";
import { Report } from "../models/report.schema";

export const IReportRepositoryToken = Symbol('IReportRepository');

export interface IReportRepository {
    create(reporterId: string, reportDto: ReportUserDto): Promise<Report>;
}