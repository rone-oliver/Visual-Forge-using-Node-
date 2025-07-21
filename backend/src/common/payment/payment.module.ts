import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { IPaymentServiceToken } from './interfaces/payment-service.interface';
import { PaymentService } from './payment.service';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: IPaymentServiceToken,
      useClass: PaymentService,
    },
  ],
  exports: [IPaymentServiceToken],
})
export class PaymentModule {}
