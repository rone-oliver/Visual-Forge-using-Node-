import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, map, Observable } from 'rxjs';
import { IPaymentVerification } from '../interfaces/quotation.interface';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  // Services
  private http = inject(HttpClient);

  constructor() {};

  openRazorpayCheckout(order: any): Promise<IPaymentVerification> {
    return new Promise((resolve, reject) => {
      const options = {
        key: environment.razorpay.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Visual Forge',
        description: 'Payment for services',
        order_id: order.id,
        handler: (response: any) => {
          this.verifyPayment(response)
            .subscribe({
              next: (verificationResult: IPaymentVerification) => {
                console.log('Payment verification result:', verificationResult);
                resolve(verificationResult);
              },
              error:  (error) => {
                console.error('Payment verification failed:', error);
                reject(error);
              }
            });
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#080F25'
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    });
  }

  createOrder(amount: number, currency: string, quotationId: string) {
    return this.http.post(`${environment.apiUrl}/user/payment`, {
      amount,
      currency,
      quotationId
    });
  }

  verifyPayment(response: any): Observable<IPaymentVerification> {
    return this.http.post<IPaymentVerification>(`${environment.apiUrl}/user/payment/verify`, response);
  }
}
