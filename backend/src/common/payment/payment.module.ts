import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { HttpModule } from '@nestjs/axios';
import { IPaymentServiceToken } from './interfaces/payment-service.interface';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: IPaymentServiceToken,
      useClass: PaymentService,
    }
  ],
  exports: [IPaymentServiceToken]
})
export class PaymentModule {}
