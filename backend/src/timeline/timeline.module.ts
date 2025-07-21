import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ITimelineRepositoryToken } from './interfaces/timeline.repository.interface';
import { ITimelineServiceToken } from './interfaces/timeline.service.interface';
import { Timeline, TimelineSchema } from './models/timeline.schema';
import { TimelineRepository } from './repositories/timeline.repository';
import { TimelineService } from './timeline.service';

@Module({
  providers: [
    {
      provide: ITimelineServiceToken,
      useClass: TimelineService,
    },
    {
      provide: ITimelineRepositoryToken,
      useClass: TimelineRepository,
    },
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Timeline.name, schema: TimelineSchema },
    ]),
  ],
  exports: [ITimelineServiceToken, ITimelineRepositoryToken],
})
export class TimelineModule {}
