import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IPaymentService } from './interfaces/payment-service.interface';
import { IQuotationService } from 'src/quotation/interfaces/quotation.service.interface';

export enum RazorpayAccountType {
    CURRENT_ACCOUNT = 'current_account',
    RAZORPAYX_LITE = 'razorpayx_lite',
    FIXED_DEPOSIT = 'fixed_deposit',
    ESCROW = 'escrow',
}

@Injectable()
export class PaymentService implements IPaymentService {
    private readonly _logger = new Logger(PaymentService.name);
    private readonly _razorpay: Razorpay;
    private readonly _razorpayKeyId: string;
    private readonly _razorpayKeySecret: string;
    private readonly _DEFAULT_CURRENCY = 'INR';

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_SECRET_KEY');
        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials are not configured');
        }
        this._razorpayKeyId = keyId;
        this._razorpayKeySecret = keySecret;
        this._razorpay = new Razorpay({
            key_id: this._razorpayKeyId,
            key_secret: this._razorpayKeySecret,
        });
    }

    async createRazorpayOrder(amount: number, currency: string = this._DEFAULT_CURRENCY, quotationId: string, receipt?: string) {
        try {
            const order = await this._razorpay.orders.create({
                amount: amount * 100, // Amount in paise
                currency: currency,
                receipt: receipt,
                notes: {
                    quotationId
                }, // Optional notes
            });
            return order;
            // Sample order data
            // {
            //     "id": "order_IkB2VzyXaWxdWF",
            //     "entity": "order",
            //     "amount": 100000, // ₹1000.00
            //     "amount_paid": 0,
            //     "amount_due": 100000,
            //     "currency": "INR",
            //     "receipt": "rcpt_123",
            //     "status": "created",
            //     "attempts": 0,
            //     "notes": [],
            //     "created_at": 1694857598
            // }
        } catch (error) {
            this._logger.error('Error creating Razorpay order:', error);
            throw new Error('Failed to create Razorpay order');
        }
    }

    async fetchPaymentDetails(paymentId: string) {
        try {
            const payment = await this._razorpay.payments.fetch(paymentId);
            // payment.status will be: 'created', 'authorized', 'captured', 'failed', etc.
            // payment.amount_paid will have the actual paid amount
            return payment;
        } catch (error) {
            this._logger.error('Error fetching payment details:', error);
            throw new Error('Failed to fetch payment details');
        }
    }

    async fetchOrderStatus(orderId: string) {
        try {
            const order = await this._razorpay.orders.fetch(orderId);
            return order;
        } catch (error) {
            this._logger.error('Error fetching order status: ',error);
            throw new Error('Failed to fetch order status');
        }
    }

    async reconcileStuckPayments(quotationService: IQuotationService) {
        try {
            // Find quotations that have been in payment progress for more than 10 minutes
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            
            const stuckQuotations = await quotationService.findMany({
                isPaymentInProgress: true,
            });
            if(!stuckQuotations){
                this._logger.warn('No quotations found for clearing the payment states');
                return;
            }

            for (const quotation of stuckQuotations) {
                await quotationService.updateQuotation({_id:quotation._id}, {
                    isPaymentInProgress: false
                });
            }

            this._logger.log(`Reconciled ${stuckQuotations.length} stuck quotations`);
        } catch (error) {
            this._logger.error('Error in payment reconciliation job:', error);
            throw error;
        }
    }

    async handleWebhook(event: string, data: any, quotationService: IQuotationService) {
        try {
            switch (event) {
                case 'payment.failed':
                case 'order.expired':
                    if (data.order_id) {
                        const quotation = await quotationService.findOneByRazorpayOrderId(data.order_id);
                        if (quotation) {
                            await quotationService.updateQuotation(quotation._id, {
                                isPaymentInProgress: false,
                                advancePaymentOrderId: data.order_id === quotation.advancePaymentOrderId ? null : quotation.advancePaymentOrderId,
                                balancePaymentOrderId: data.order_id === quotation.balancePaymentOrderId ? null : quotation.balancePaymentOrderId
                            });
                        }
                    }
                    break;
                default:
                    break;
            }
        } catch (error) {
            this._logger.error('Error handling Razorpay webhook:', error);
            throw error;
        }
    }

    async refundPayment(paymentId: string, amount: number) {
        try {
            const refund = await this._razorpay.payments.refund(paymentId, {
                amount: amount * 100, // Amount in paise
            });
            return refund;
        } catch (error) {
            this._logger.error('Error processing refund:', error);
            throw new Error('Failed to process refund');
        }
    }

    async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string){
        const generatedSignature = crypto
            .createHmac('sha256', this._razorpayKeySecret)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            this._logger.warn(`Payment verification failed for orderId: ${razorpayOrderId}`);
            return { success: false, message: 'Payment verification failed' };
        }

        try {
            const paymentDetails = await this.fetchPaymentDetails(razorpayPaymentId);
            return {
                success: true,
                ...paymentDetails,
            };
        } catch (error) {
            this._logger.error(`Failed to fetch payment details for paymentId: ${razorpayPaymentId}`, error);
            return { success: false, message: 'Failed to fetch payment details' };
        }
    }

    async getAccountBalance(): Promise<number> {
        try {
            const url = 'https://api.razorpay.com/v1/banking_balances';
            const authToken = Buffer.from(`${this._razorpayKeyId}:${this._razorpayKeySecret}`).toString('base64');

            const { data } = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        'Authorization': `Basic ${authToken}`,
                    },
                }),
            );
            if (data && data.items && data.items.length > 0) {
                const currentAccount = data.items.find(
                    (item: any) => item.account_type === RazorpayAccountType.RAZORPAYX_LITE
                );

                if (currentAccount) {
                    return currentAccount.available_amount / 100;
                }
            }
            
            this._logger.warn('No RazorpayX current account balance was found.');
            return 0;
        } catch (error) {
            this._logger.error('Error fetching Razorpay banking balance:', error.response?.data || error.message);
            throw new Error('Failed to fetch Razorpay banking balance');
        }
    }
}
