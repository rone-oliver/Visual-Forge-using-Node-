import { Inject, Injectable } from '@nestjs/common';
import { Timeline } from './models/timeline.schema';
import { CreateTimelineDto } from './dtos/timeline.dto';
import { ITimelineService } from './interfaces/timeline.service.interface';
import { ITimelineRepository, ITimelineRepositoryToken } from './interfaces/timeline.repository.interface';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class TimelineService implements ITimelineService {
    private readonly logger = new Logger(TimelineService.name);

    constructor(
        @Inject(ITimelineRepositoryToken) private readonly timelineRepo: ITimelineRepository,
    ) { }

    async create(createTimelineDto: CreateTimelineDto): Promise<Timeline> {
        try {
            return await this.timelineRepo.create(createTimelineDto);
        } catch (error) {
            this.logger.error(`Error creating timeline: ${error.message}`, error.stack);
            throw new Error('Failed to create timeline');
        }
    }

    async findByQuotationId(quotationId: Types.ObjectId): Promise<Timeline[]> {
        try {
            return await this.timelineRepo.findByQuotationId(quotationId);
        } catch (error) {
            this.logger.error(`Error fetching timeline: ${error.message}`, error.stack);
            throw new Error('Failed to fetch timeline');
        }
    }
}