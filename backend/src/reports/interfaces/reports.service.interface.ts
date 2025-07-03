import { ReportUserDto, SuccessResponseDto } from "src/users/dto/users.dto";

export const IReportServiceToken = Symbol('IReportService');

export interface IReportService {
    reportUser(reporterId: string, reportDto: ReportUserDto): Promise<SuccessResponseDto>;
}