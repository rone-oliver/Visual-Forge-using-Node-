import { Module } from '@nestjs/common';
import { WorksService } from './works.service';
import { IWorkServiceToken } from './interfaces/works.service.interface';
import { IWorkRepositoryToken } from './interfaces/works.repository.interface';
import { WorkRepository } from './repositories/work.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Works, workSchema } from 'src/works/models/works.schema';
import { User, userSchema } from 'src/users/models/user.schema';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { TimelineModule } from 'src/timeline/timeline.module';
import { QuotationModule } from 'src/quotation/quotation.module';

@Module({
  providers: [
    {
      provide: IWorkServiceToken,
      useClass: WorksService,
    },
    {
      provide: IWorkRepositoryToken,
      useClass: WorkRepository
    },
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Works.name, schema: workSchema },
      { name: User.name, schema: userSchema },
    ]),
    CloudinaryModule, TimelineModule, QuotationModule,
  ],
  exports: [IWorkServiceToken, IWorkRepositoryToken]
})
export class WorksModule {}
