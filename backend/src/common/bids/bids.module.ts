import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotationModule } from 'src/quotation/quotation.module';

import {
  Quotation,
  QuotationSchema,
} from '../../quotation/models/quotation.schema';

import { BidsService } from './bids.service';
import {
  IBidRepositoryToken,
  IBidServiceToken,
} from './interfaces/bid.interfaces';
import { Bid, BidSchema } from './models/bids.schema';
import { BidRepository } from './repositories/bid.repository';

@Module({
  providers: [
    {
      provide: IBidRepositoryToken,
      useClass: BidRepository,
    },
    {
      provide: IBidServiceToken,
      useClass: BidsService,
    },
  ],
  imports: [
    MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }]),
    EventEmitterModule.forRoot(),
    QuotationModule,
  ],
  exports: [IBidServiceToken, IBidRepositoryToken],
})
export class BidsModule {}
