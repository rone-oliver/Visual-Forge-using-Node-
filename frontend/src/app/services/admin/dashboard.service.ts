import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponseDto } from '../../interfaces/admin.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly _baseUrl = `${environment.apiUrl}/admin`;

  // Services
  private readonly _http = inject(HttpClient);

  constructor() { }

  getDashboardData(): Observable<DashboardResponseDto> {
    return this._http.get<DashboardResponseDto>(`${this._baseUrl}/dashboard`);
  }
}
