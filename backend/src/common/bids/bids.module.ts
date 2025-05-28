import { Module } from '@nestjs/common';
import { BidsService } from './bids.service';
import { Bid, BidSchema } from '../models/bids.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation, QuotationSchema } from '../models/quotation.schema';

@Module({
  providers: [BidsService],
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema},
      { name: Quotation.name, schema: QuotationSchema}
    ])
  ],
  exports:[BidsService]
})
export class BidsModule {}
