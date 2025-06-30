import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation, QuotationSchema } from './models/quotation.schema';
import { IQuotationRepositoryToken } from './interfaces/quotation.repository.interface';
import { QuotationRepository } from './repositories/quotation.repository';
import { IQuotationServiceToken } from './interfaces/quotation.service.interface';
import { QuotationService } from './quotation.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Quotation.name, schema: QuotationSchema }]),
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
    exports: [IQuotationServiceToken],
})
export class QuotationModule {}
