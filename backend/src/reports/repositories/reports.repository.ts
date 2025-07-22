import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/common/database/base.repository';

import { IReportRepository } from '../interfaces/reports.repository.interface';
import { Report, ReportDocument, ReportStatus } from '../models/report.schema';

export class ReportRepository
  extends BaseRepository<Report, ReportDocument>
  implements IReportRepository
{
  constructor(
    @InjectModel(Report.name)
    private readonly _reportModel: Model<ReportDocument>,
  ) {
    super(_reportModel);
  }

  async countDocuments(): Promise<number> {
    return this._reportModel.countDocuments().exec();
  }

  async getPendingReports(): Promise<Report[]> {
    return this._reportModel
      .find({ status: ReportStatus.PENDING })
      .populate('reporterId', 'username email')
      .populate('reportedUserId', 'username email isBlocked')
      .sort({ createdAt: -1 })
      .exec();
  }
}
