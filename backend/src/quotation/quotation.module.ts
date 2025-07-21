import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimelineModule } from 'src/timeline/timeline.module';

import { IQuotationRepositoryToken } from './interfaces/quotation.repository.interface';
import { IQuotationServiceToken } from './interfaces/quotation.service.interface';
import { Quotation, QuotationSchema } from './models/quotation.schema';
import { QuotationService } from './quotation.service';
import { QuotationRepository } from './repositories/quotation.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quotation.name, schema: QuotationSchema },
    ]),
    TimelineModule,
  ],
  providers: [
    {
      provide: IQuotationRepositoryToken,
      useClass: QuotationRepository,
    },
    {
      provide: IQuotationServiceToken,
      useClass: QuotationService,
    },
  ],
  exports: [IQuotationServiceToken, IQuotationRepositoryToken],
})
export class QuotationModule {}
