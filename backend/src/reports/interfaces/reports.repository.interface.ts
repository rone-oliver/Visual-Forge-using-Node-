import { Report, ReportDocument } from '../models/report.schema';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';

export const IReportRepositoryToken = Symbol('IReportRepository');

export interface IReportRepository extends IBaseRepository<Report, ReportDocument> {
  countDocuments(): Promise<number>;
  getPendingReports(): Promise<Report[]>;
}
