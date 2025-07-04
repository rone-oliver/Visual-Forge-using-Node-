import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { IReportRepositoryToken } from './interfaces/reports.repository.interface';
import { ReportRepository } from './repositories/reports.repository';
import { IReportServiceToken } from './interfaces/reports.service.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './models/report.schema';

@Module({
  providers: [
    {
      provide: IReportRepositoryToken,
      useClass: ReportRepository
    },
    {
      provide: IReportServiceToken,
      useClass: ReportsService
    }
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
    ])
  ],
  exports: [IReportServiceToken,IReportRepositoryToken]
})
export class ReportsModule {}
