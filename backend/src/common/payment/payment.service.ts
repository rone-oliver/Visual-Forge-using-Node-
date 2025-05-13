import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

@Injectable()
export class PaymentService {
    private readonly razorpay: Razorpay;
    private readonly razorpayKeyId: string;
    private readonly razorpayKeySecret: string;
    private readonly DEFAULT_CURRENCY = 'INR';

    constructor(private readonly configService: ConfigService) {
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
            console.error('Error creating Razorpay order:', error);
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
            console.error('Error fetching payment details:', error);
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
            console.error('Error processing refund:', error);
            throw new Error('Failed to process refund');
        }
    }

    async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string){
        const generatedSignature = crypto
            .createHmac('sha256', this.razorpayKeySecret)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');

        return {
            success : generatedSignature === razorpaySignature,
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
        };
    }
}
