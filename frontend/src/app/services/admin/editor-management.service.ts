import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EditorRequest } from '../../interfaces/user.interface';
import { Observable } from 'rxjs';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root'
})
export class EditorManagementService {
  private readonly adminUrl = `${environment.apiUrl}/admin`;

  // Services
  private readonly _http = inject(HttpClient);
  private readonly _logger = inject(LoggerService);

  constructor() { }

  getEditorRequests(): Observable<EditorRequest[]>{
    return this._http.get<EditorRequest[]>(`${this.adminUrl}/requests/editor`);
  }

  approveRequest(requestId: string): Observable<boolean>{
    return this._http.patch<boolean>(`${this.adminUrl}/requests/editor/${requestId}/approve`,{});
  }

  rejectRequest(requestId: string, reason: string): Observable<boolean>{
    return this._http.patch<boolean>(`${this.adminUrl}/requests/editor/${requestId}/reject`,{ reason });
  }

  getEditors(params?:{[key:string]:any}): Observable<{editors:any[],total: number}>{
    let httpParams = new HttpParams();
    if(params){
      this._logger.debug('params:',params);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this._http.get<{editors:any[],total: number}>(`${this.adminUrl}/editors`,{params:httpParams});
  }
}
