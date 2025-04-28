import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EditorRequest } from '../../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorManagementService {
  private readonly apiUrl = `${environment.apiUrl}`

  constructor(
    private http: HttpClient,
  ) { }

  getEditorRequests(): Observable<EditorRequest[]>{
    return this.http.get<EditorRequest[]>(`${this.apiUrl}/admin/editor-requests`);
  }

  approveRequest(requestId: string): Observable<boolean>{
    return this.http.patch<boolean>(`${this.apiUrl}/admin/editor-request/approve`,{requestId});
  }

  rejectRequest(requestId: string, reason: string): Observable<boolean>{
    return this.http.patch<boolean>(`${this.apiUrl}/admin/editor-request/reject`,{requestId, reason});
  }

  getEditors(params?:{[key:string]:any}): Observable<[]>{
    let httpParams = new HttpParams();
    if(params){
      console.log('params:',params);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<[]>(`${this.apiUrl}/admin/editors`,{params:httpParams});
  }
}
