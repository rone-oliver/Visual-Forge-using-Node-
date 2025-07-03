import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
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
  controllers: [ReportsController],
  exports: [IReportServiceToken,IReportRepositoryToken]
})
export class ReportsModule {}
