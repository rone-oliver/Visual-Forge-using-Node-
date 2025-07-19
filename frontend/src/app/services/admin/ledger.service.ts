import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedLedgerResponse } from '../../interfaces/admin-ledger.interface';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private readonly _apiUrl = `${environment.apiUrl}/admin/wallet`;

  // Services
  private readonly _http = inject(HttpClient);

  constructor() { }

  getLedger(page?: number, limit?: number): Observable<PaginatedLedgerResponse> {
    let params = new HttpParams()
    if(page){
      params=params.set('page', page)
    }
    if(limit){
      params=params.set('limit', limit)
    }
    return this._http.get<PaginatedLedgerResponse>(`${this._apiUrl}/ledger`, { params });
  }
}
