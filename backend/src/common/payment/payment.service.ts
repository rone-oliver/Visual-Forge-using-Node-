import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export enum RazorpayAccountType {
    CURRENT_ACCOUNT = 'current_account',
    RAZORPAYX_LITE = 'razorpayx_lite',
    FIXED_DEPOSIT = 'fixed_deposit',
    ESCROW = 'escrow',
}

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly razorpay: Razorpay;
    private readonly razorpayKeyId: string;
    private readonly razorpayKeySecret: string;
    private readonly DEFAULT_CURRENCY = 'INR';

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_SECRET_KEY');
        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials are not configured');
        }
        this.razorpayKeyId = keyId;
        this.razorpayKeySecret = keySecret;
        this.razorpay = new Razorpay({
            key_id: this.razorpayKeyId,
            key_secret: this.razorpayKeySecret,
        });
    }

    async createRazorpayOrder(amount: number, currency: string = this.DEFAULT_CURRENCY, receipt?: string) {
        try {
            const order = await this.razorpay.orders.create({
                amount: amount * 100, // Amount in paise
                currency: currency,
                receipt: receipt,
                // notes: { ... }, // Optional notes
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
            this.logger.error('Error creating Razorpay order:', error);
            throw new Error('Failed to create Razorpay order');
        }
    }

    async fetchPaymentDetails(paymentId: string) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            // payment.status will be: 'created', 'authorized', 'captured', 'failed', etc.
            // payment.amount_paid will have the actual paid amount
            return payment;
        } catch (error) {
            this.logger.error('Error fetching payment details:', error);
            throw new Error('Failed to fetch payment details');
        }
    }

    async refundPayment(paymentId: string, amount: number) {
        try {
            const refund = await this.razorpay.payments.refund(paymentId, {
                amount: amount * 100, // Amount in paise
            });
            return refund;
        } catch (error) {
            this.logger.error('Error processing refund:', error);
            throw new Error('Failed to process refund');
        }
    }

    async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string){
        const generatedSignature = crypto
            .createHmac('sha256', this.razorpayKeySecret)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            this.logger.warn(`Payment verification failed for orderId: ${razorpayOrderId}`);
            return { success: false, message: 'Payment verification failed' };
        }

        try {
            const paymentDetails = await this.fetchPaymentDetails(razorpayPaymentId);
            return {
                success: true,
                ...paymentDetails,
            };
        } catch (error) {
            this.logger.error(`Failed to fetch payment details for paymentId: ${razorpayPaymentId}`, error);
            return { success: false, message: 'Failed to fetch payment details' };
        }
    }

    async getAccountBalance(): Promise<number> {
        try {
            const url = 'https://api.razorpay.com/v1/banking_balances';
            const authToken = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');

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
            
            this.logger.warn('No RazorpayX current account balance was found.');
            return 0;
        } catch (error) {
            this.logger.error('Error fetching Razorpay banking balance:', error.response?.data || error.message);
            throw new Error('Failed to fetch Razorpay banking balance');
        }
    }
}
