import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedLedgerResponse } from '../../interfaces/admin-ledger.interface';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private apiUrl = `${environment.apiUrl}/admin/wallet`;

  constructor(private http: HttpClient) { }

  getLedger(page?: number, limit?: number): Observable<PaginatedLedgerResponse> {
    let params = new HttpParams()
    if(page){
      params=params.set('page', page)
    }
    if(limit){
      params=params.set('limit', limit)
    }
    return this.http.get<PaginatedLedgerResponse>(`${this.apiUrl}/ledger`, { params });
  }
}
