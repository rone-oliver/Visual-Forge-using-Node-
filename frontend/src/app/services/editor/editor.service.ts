import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { FileAttachmentResponse, IQuotation } from '../../interfaces/quotation.interface';
import { CompletedWork } from '../../interfaces/completed-word.interface';
import { Editor } from '../../interfaces/editor.interface';

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

  getAcceptedQuotations(): Observable<IQuotation[]>{
    return this.http.get<IQuotation[]>(`${this.editorApiUrl}/quotations/accepted`);
  }

  submitQuotationResponse(workData: any): Observable<boolean>{
    return this.http.post<boolean>(`${this.editorApiUrl}/quotation/submit-response`, workData);
  }

  uploadWorkFiles(files: File[]): Observable<FileAttachmentResponse[]>{
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder','Visual Forge/Work Files');
    return this.http.post<FileAttachmentResponse[]>(`${this.editorApiUrl}/works/files-upload`, formData,{ reportProgress: true}).pipe(
      catchError(error => { throw error})
    );
  }

  getCompletedWorks(): Observable<CompletedWork[]> {
    return this.http.get<CompletedWork[]>(`${this.editorApiUrl}/works/completed`).pipe(
      catchError(error => { throw error })
    );
  }

  getEditor(id:string): Observable<any>{
    return this.http.get<any>(`${this.editorApiUrl}/${id}`).pipe(
      catchError(error => { throw error })
    );
  }
}
