import { Module } from '@nestjs/common';
import { ReconciliationModule } from './reconciliation/reconciliation.module';

@Module({
  imports: [ReconciliationModule]
})
export class JobsModule {}
