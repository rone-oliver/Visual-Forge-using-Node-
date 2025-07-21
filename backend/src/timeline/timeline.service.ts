import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { CreateTimelineDto } from './dtos/timeline.dto';
import {
  ITimelineRepository,
  ITimelineRepositoryToken,
} from './interfaces/timeline.repository.interface';
import { ITimelineService } from './interfaces/timeline.service.interface';
import { Timeline } from './models/timeline.schema';

@Injectable()
export class TimelineService implements ITimelineService {
  private readonly _logger = new Logger(TimelineService.name);

  constructor(
    @Inject(ITimelineRepositoryToken)
    private readonly _timelineRepo: ITimelineRepository,
  ) {}

  async create(createTimelineDto: CreateTimelineDto): Promise<Timeline> {
    try {
      return await this._timelineRepo.create(createTimelineDto);
    } catch (error) {
      this._logger.error(
        `Error creating timeline: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to create timeline');
    }
  }

  async findByQuotationId(quotationId: Types.ObjectId): Promise<Timeline[]> {
    try {
      return await this._timelineRepo.findByQuotationId(quotationId);
    } catch (error) {
      this._logger.error(
        `Error fetching timeline: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to fetch timeline');
    }
  }
}
