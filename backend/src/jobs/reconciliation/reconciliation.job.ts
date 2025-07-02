import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IPaymentService, IPaymentServiceToken } from 'src/common/payment/interfaces/payment-service.interface';
import { PaymentService } from 'src/common/payment/payment.service';
import { IQuotationService, IQuotationServiceToken } from 'src/quotation/interfaces/quotation.service.interface';

@Injectable()
export class ReconciliationJob {
    private readonly logger = new Logger(ReconciliationJob.name);

    constructor(
        @Inject(IPaymentServiceToken) private readonly paymentService: IPaymentService,
        @Inject(IQuotationServiceToken) private readonly quotationService: IQuotationService,
    ) {}

    @Cron(CronExpression.EVERY_10_MINUTES)
    async handleReconciliation() {
        try {
            this.logger.log('Starting payment reconciliation job...');
            await this.paymentService.reconcileStuckPayments(this.quotationService);
            this.logger.log('Payment reconciliation job completed successfully');
        } catch (error) {
            this.logger.error('Error in reconciliation job:', error);
        }
    }
}