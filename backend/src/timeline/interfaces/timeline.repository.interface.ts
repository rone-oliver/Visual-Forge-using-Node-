import { Types } from 'mongoose';

import { CreateTimelineDto } from '../dtos/timeline.dto';
import { Timeline } from '../models/timeline.schema';

export const ITimelineRepositoryToken = Symbol('TimelineRepositoryToken');

export interface ITimelineRepository {
  create(createTimelineDto: CreateTimelineDto): Promise<Timeline>;
  findByQuotationId(quotationId: Types.ObjectId): Promise<Timeline[]>;
}
