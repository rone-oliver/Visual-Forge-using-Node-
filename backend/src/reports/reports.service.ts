import { Inject, Injectable } from '@nestjs/common';
import { ReportUserDto, SuccessResponseDto } from 'src/users/dto/users.dto';
import { IReportService } from './interfaces/reports.service.interface';
import { IReportRepository, IReportRepositoryToken } from './interfaces/reports.repository.interface';
import { Logger } from '@nestjs/common';

@Injectable()
export class ReportsService implements IReportService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        @Inject(IReportRepositoryToken) private readonly reportRepository: IReportRepository,
    ){}

    async reportUser(reporterId: string, reportDto: ReportUserDto): Promise<SuccessResponseDto>{
        try {
            const report = await this.reportRepository.create(reporterId, reportDto);
            return { success: true, message: 'Report submitted successfully' };
        } catch (error) {
            this.logger.error(`Error reporting user: ${error.message}`);
            throw error;
        }
    }
}
