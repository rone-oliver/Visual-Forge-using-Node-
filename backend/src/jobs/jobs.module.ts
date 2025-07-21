import { Module } from '@nestjs/common';

import { OverdueQuotationsModule } from './overdue-quotations/overdue-quotations.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';

@Module({
  imports: [ReconciliationModule, OverdueQuotationsModule],
})
export class JobsModule {}
