import { Inject, Injectable } from '@nestjs/common';
import { ReportUserDto, SuccessResponseDto } from 'src/users/dto/users.dto';
import { IReportService } from './interfaces/reports.service.interface';
import { IReportRepository, IReportRepositoryToken } from './interfaces/reports.repository.interface';
import { Logger } from '@nestjs/common';
import { Report } from './models/report.schema';
import { UpdateReportDto } from './dtos/reports.dto';

@Injectable()
export class ReportsService implements IReportService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        @Inject(IReportRepositoryToken) private readonly reportRepository: IReportRepository,
    ){}

    async reportUser(reporterId: string, reportDto: ReportUserDto): Promise<SuccessResponseDto>{
        try {
            await this.reportRepository.create(reporterId, reportDto);
            return { success: true, message: 'Report submitted successfully' };
        } catch (error) {
            this.logger.error(`Error reporting user: ${error.message}`);
            throw error;
        }
    }

    async getPendingReports(): Promise<Report[]> {
        return this.reportRepository.getPendingReports();
    }

    async updateReport(reportId: string, updateDto: UpdateReportDto): Promise<Report | null> {
        return this.reportRepository.updateReport(reportId, updateDto);
    }

    async countDocuments(): Promise<number> {
        return this.reportRepository.countDocuments();
    }
}
