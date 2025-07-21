import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IPaymentService,
  IPaymentServiceToken,
} from 'src/common/payment/interfaces/payment-service.interface';
import { PaymentService } from 'src/common/payment/payment.service';
import {
  IQuotationService,
  IQuotationServiceToken,
} from 'src/quotation/interfaces/quotation.service.interface';

@Injectable()
export class ReconciliationJob {
  private readonly _logger = new Logger(ReconciliationJob.name);

  constructor(
    @Inject(IPaymentServiceToken)
    private readonly _paymentService: IPaymentService,
    @Inject(IQuotationServiceToken)
    private readonly _quotationService: IQuotationService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleReconciliation() {
    try {
      this._logger.log('Starting payment reconciliation job...');
      await this._paymentService.reconcileStuckPayments(this._quotationService);
      this._logger.log('Payment reconciliation job completed successfully');
    } catch (error) {
      this._logger.error('Error in reconciliation job:', error);
    }
  }
}
