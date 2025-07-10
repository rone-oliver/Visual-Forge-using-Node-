import { Module } from '@nestjs/common';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { OverdueQuotationsModule } from './overdue-quotations/overdue-quotations.module';

@Module({
  imports: [ReconciliationModule, OverdueQuotationsModule],
})
export class JobsModule {}
