import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { IReportRepositoryToken } from './interfaces/reports.repository.interface';
import { IReportServiceToken } from './interfaces/reports.service.interface';
import { Report, ReportSchema } from './models/report.schema';
import { ReportsService } from './reports.service';
import { ReportRepository } from './repositories/reports.repository';

@Module({
  providers: [
    {
      provide: IReportRepositoryToken,
      useClass: ReportRepository,
    },
    {
      provide: IReportServiceToken,
      useClass: ReportsService,
    },
  ],
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
  ],
  exports: [IReportServiceToken, IReportRepositoryToken],
})
export class ReportsModule {}
