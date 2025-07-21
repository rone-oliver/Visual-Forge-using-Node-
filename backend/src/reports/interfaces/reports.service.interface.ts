import { ReportUserDto, SuccessResponseDto } from 'src/users/dto/users.dto';

import { UpdateReportDto } from '../dtos/reports.dto';
import { Report } from '../models/report.schema';

export const IReportServiceToken = Symbol('IReportService');

export interface IReportService {
  reportUser(
    reporterId: string,
    reportDto: ReportUserDto,
  ): Promise<SuccessResponseDto>;
  getPendingReports(): Promise<Report[]>;
  updateReport(
    reportId: string,
    updateDto: UpdateReportDto,
  ): Promise<Report | null>;
  countDocuments(): Promise<number>;
}
