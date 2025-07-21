import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from 'src/common/payment/payment.module';
import { QuotationModule } from 'src/quotation/quotation.module';

import { ReconciliationJob } from './reconciliation.job';

@Module({
  imports: [QuotationModule, PaymentModule, ScheduleModule.forRoot()],
  providers: [ReconciliationJob],
})
export class ReconciliationModule {}
