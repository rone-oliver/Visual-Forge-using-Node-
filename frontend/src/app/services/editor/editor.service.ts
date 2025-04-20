import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IQuotation } from '../../interfaces/quotation.interface';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private readonly apiUrl = environment.apiUrl;
  private readonly editorApiUrl = `${this.apiUrl}/editor`;

  constructor(private http: HttpClient) { };

  getPublishedQuotations(): Observable<IQuotation[]>{
    return this.http.get<IQuotation[]>(`${this.editorApiUrl}/quotations/published`);
  }

  acceptQuotation(quotationId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.editorApiUrl}/accept-quotation`,{quotationId});
  }
}
