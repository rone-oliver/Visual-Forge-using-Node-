import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation, QuotationSchema } from './models/quotation.schema';
import { IQuotationRepositoryToken } from './interfaces/quotation.repository.interface';
import { QuotationRepository } from './repositories/quotation.repository';
import { IQuotationServiceToken } from './interfaces/quotation.service.interface';
import { QuotationService } from './quotation.service';
import { TimelineModule } from 'src/timeline/timeline.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Quotation.name, schema: QuotationSchema }]),
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
    exports: [IQuotationServiceToken,IQuotationRepositoryToken],
})
export class QuotationModule {}
