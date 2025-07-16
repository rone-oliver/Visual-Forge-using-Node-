import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentType {
    ADVANCE = 'advance',
    BALANCE = 'balance'
}

export interface PayFromWalletDto {
  quotationId: string;
  amount: number;
  paymentType: PaymentType;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private walletApiUrl = `${environment.apiUrl}/user/wallet`;

  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(this.walletApiUrl);
  }

  payWithWallet(payload: PayFromWalletDto): Observable<any> {
    return this.http.post(`${this.walletApiUrl}/pay`, payload);
  }
}
