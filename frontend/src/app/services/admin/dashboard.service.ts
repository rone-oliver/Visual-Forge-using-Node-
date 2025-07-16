import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponseDto } from '../../interfaces/admin.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<DashboardResponseDto> {
    return this.http.get<DashboardResponseDto>(`${this.baseUrl}/dashboard`);
  }
}
