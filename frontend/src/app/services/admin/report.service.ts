import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report, UpdateReportPayload } from '../../interfaces/report.interface';

interface SuccessResponse {
  success:boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly adminApiUrl = `${environment.apiUrl}/admin`;

  constructor(private readonly http: HttpClient) { }

  getPendingReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.adminApiUrl}/reports/pending`);
  }

  updateReport(reportId: string, payload: UpdateReportPayload): Observable<Report> {
    return this.http.patch<Report>(`${this.adminApiUrl}/reports/${reportId}`, payload);
  }

  blockUser(userId: string): Observable<SuccessResponse> {
    return this.http.patch<SuccessResponse>(`${this.adminApiUrl}/users/${userId}/block`, {});
  }
}
