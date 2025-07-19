import { inject, Injectable } from '@angular/core';
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
  private readonly _adminApiUrl = `${environment.apiUrl}/admin`;

  // Services
  private readonly _http = inject(HttpClient);

  constructor() { }

  getPendingReports(): Observable<Report[]> {
    return this._http.get<Report[]>(`${this._adminApiUrl}/reports/pending`);
  }

  updateReport(reportId: string, payload: UpdateReportPayload): Observable<Report> {
    return this._http.patch<Report>(`${this._adminApiUrl}/reports/${reportId}`, payload);
  }

  blockUser(userId: string): Observable<SuccessResponse> {
    return this._http.patch<SuccessResponse>(`${this._adminApiUrl}/users/${userId}/block`, {});
  }
}
