import { InjectModel } from "@nestjs/mongoose";
import { ITimelineRepository } from "../interfaces/timeline.repository.interface";
import { Timeline, TimelineDocument } from "../models/timeline.schema";
import { CreateTimelineDto } from "../dtos/timeline.dto";
import { Model, Types } from "mongoose";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TimelineRepository implements ITimelineRepository {
    constructor(
        @InjectModel(Timeline.name) private readonly _timelineModel: Model<TimelineDocument>,
    ){};

    async create(createTimelineDto: CreateTimelineDto): Promise<Timeline> {
        return await this._timelineModel.create(createTimelineDto);
    }

    async findByQuotationId(quotationId: Types.ObjectId): Promise<Timeline[]> {
        return this._timelineModel.find({ quotationId }).sort({ timestamp: 1 }).exec();
    }
}