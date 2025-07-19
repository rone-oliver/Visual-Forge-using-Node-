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
  private readonly _http = inject(HttpClient);
  private readonly _walletApiUrl = `${environment.apiUrl}/user/wallet`;

  getWallet(): Observable<Wallet> {
    return this._http.get<Wallet>(this._walletApiUrl);
  }

  payWithWallet(payload: PayFromWalletDto): Observable<any> {
    return this._http.post(`${this._walletApiUrl}/pay`, payload);
  }
}
