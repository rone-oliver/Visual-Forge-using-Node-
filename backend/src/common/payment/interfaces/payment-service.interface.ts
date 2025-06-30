export const IPaymentServiceToken = Symbol('IPaymentService');

export interface IPaymentService {
    createRazorpayOrder(amount: number, currency?: string, receipt?: string): Promise<any>;
    fetchPaymentDetails(paymentId: string): Promise<any>;
    refundPayment(paymentId: string, amount: number): Promise<any>;
    verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<any>;
    getAccountBalance(): Promise<number>;
}