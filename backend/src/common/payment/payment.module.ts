import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}
