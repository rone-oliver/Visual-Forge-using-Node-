import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Timeline, TimelineSchema } from './models/timeline.schema';
import { ITimelineServiceToken } from './interfaces/timeline.service.interface';
import { TimelineRepository } from './repositories/timeline.repository';
import { ITimelineRepositoryToken } from './interfaces/timeline.repository.interface';

@Module({
  providers: [
    {
      provide: ITimelineServiceToken,
      useClass: TimelineService
    },
    {
      provide: ITimelineRepositoryToken,
      useClass: TimelineRepository
    }
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Timeline.name, schema: TimelineSchema },
    ])
  ],
  exports: [ITimelineServiceToken, ITimelineRepositoryToken]
})
export class TimelineModule {}
