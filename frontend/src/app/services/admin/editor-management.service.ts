import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EditorRequest } from '../../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorManagementService {
  private readonly adminUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
  ) { }

  getEditorRequests(): Observable<EditorRequest[]>{
    return this.http.get<EditorRequest[]>(`${this.adminUrl}/requests/editor`);
  }

  approveRequest(requestId: string): Observable<boolean>{
    return this.http.patch<boolean>(`${this.adminUrl}/requests/editor/${requestId}/approve`,{});
  }

  rejectRequest(requestId: string, reason: string): Observable<boolean>{
    return this.http.patch<boolean>(`${this.adminUrl}/requests/editor/${requestId}/reject`,{ reason });
  }

  getEditors(params?:{[key:string]:any}): Observable<{editors:any[],total: number}>{
    let httpParams = new HttpParams();
    if(params){
      console.log('params:',params);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{editors:any[],total: number}>(`${this.adminUrl}/editors`,{params:httpParams});
  }
}
