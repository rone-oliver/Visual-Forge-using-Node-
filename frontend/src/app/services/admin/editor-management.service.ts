import { HttpClient } from '@angular/common/http';
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

  getEditors(): Observable<[]>{
    return this.http.get<[]>(`${this.apiUrl}/admin/editors`);
  }
}
