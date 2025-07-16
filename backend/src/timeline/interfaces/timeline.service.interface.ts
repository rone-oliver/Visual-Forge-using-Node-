import { Types } from "mongoose";
import { CreateTimelineDto } from "../dtos/timeline.dto";
import { Timeline } from "../models/timeline.schema";

export const ITimelineServiceToken = Symbol('ITimelineService');

export interface ITimelineService {
    create(createTimelineDto: CreateTimelineDto): Promise<Timeline>;
    findByQuotationId(quotationId: Types.ObjectId): Promise<Timeline[]>;
}