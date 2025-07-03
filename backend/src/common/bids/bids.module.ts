import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BidsService } from './bids.service';
import { Bid, BidSchema } from './models/bids.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation, QuotationSchema } from '../../quotation/models/quotation.schema';
import { BidRepository } from './repositories/bid.repository';
import { IBidRepositoryToken, IBidServiceToken } from './interfaces/bid.interfaces';

@Module({
  providers: [
    {
      provide: IBidRepositoryToken,
      useClass: BidRepository
    },
    {
      provide: IBidServiceToken,
      useClass: BidsService
    }
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema},
      { name: Quotation.name, schema: QuotationSchema}
    ]),
    EventEmitterModule.forRoot()
  ],
  exports:[IBidServiceToken,IBidRepositoryToken]
})
export class BidsModule {}
