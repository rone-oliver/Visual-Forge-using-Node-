import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ReportUserDto, SuccessResponseDto } from 'src/users/dto/users.dto';

import { UpdateReportDto } from './dtos/reports.dto';
import {
  IReportRepository,
  IReportRepositoryToken,
} from './interfaces/reports.repository.interface';
import { IReportService } from './interfaces/reports.service.interface';
import { Report } from './models/report.schema';

@Injectable()
export class ReportsService implements IReportService {
  private readonly _logger = new Logger(ReportsService.name);

  constructor(
    @Inject(IReportRepositoryToken)
    private readonly _reportRepository: IReportRepository,
  ) {}

  async reportUser(
    reporterId: string,
    reportDto: ReportUserDto,
  ): Promise<SuccessResponseDto> {
    try {
      await this._reportRepository.create(reporterId, reportDto);
      return { success: true, message: 'Report submitted successfully' };
    } catch (error) {
      this._logger.error(`Error reporting user: ${error.message}`);
      throw error;
    }
  }

  async getPendingReports(): Promise<Report[]> {
    return this._reportRepository.getPendingReports();
  }

  async updateReport(
    reportId: string,
    updateDto: UpdateReportDto,
  ): Promise<Report | null> {
    return this._reportRepository.updateReport(reportId, updateDto);
  }

  async countDocuments(): Promise<number> {
    return this._reportRepository.countDocuments();
  }
}
