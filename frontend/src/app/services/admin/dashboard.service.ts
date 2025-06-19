import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardResponseDto {
  totalUsers: number;
  totalEditors: number;
  totalReports: number;
  totalQuotations: number;
  totalEditorRequests: number;
  quotationsByStatus: {
    Published: number;
    Accepted: number;
    Completed: number;
    Expired: number;
    Cancelled: number;
  };
}

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
