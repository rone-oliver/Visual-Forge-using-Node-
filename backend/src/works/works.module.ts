import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { QuotationModule } from 'src/quotation/quotation.module';
import { TimelineModule } from 'src/timeline/timeline.module';
import { User, userSchema } from 'src/users/models/user.schema';
import { Works, workSchema } from 'src/works/models/works.schema';

import { IWorkRepositoryToken } from './interfaces/works.repository.interface';
import { IWorkServiceToken } from './interfaces/works.service.interface';
import { WorkRepository } from './repositories/work.repository';
import { WorksService } from './works.service';

@Module({
  providers: [
    {
      provide: IWorkServiceToken,
      useClass: WorksService,
    },
    {
      provide: IWorkRepositoryToken,
      useClass: WorkRepository,
    },
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Works.name, schema: workSchema },
      { name: User.name, schema: userSchema },
    ]),
    CloudinaryModule,
    TimelineModule,
    QuotationModule,
  ],
  exports: [IWorkServiceToken, IWorkRepositoryToken],
})
export class WorksModule {}
