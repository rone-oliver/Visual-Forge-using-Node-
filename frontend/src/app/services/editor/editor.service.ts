import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { FileAttachmentResponse, IQuotation } from '../../interfaces/quotation.interface';
import { CompletedWork } from '../../interfaces/completed-word.interface';
import { Editor } from '../../interfaces/editor.interface';
import { IBid } from '../../interfaces/bid.interface';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private readonly apiUrl = environment.apiUrl;
  private readonly editorApiUrl = `${this.apiUrl}/editor`;

  constructor(private http: HttpClient) { };

  getPublishedQuotations(): Observable<IQuotation[]>{
    return this.http.get<IQuotation[]>(`${this.editorApiUrl}/quotations?status=published`);
  }

  acceptQuotation(quotationId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.editorApiUrl}/quotations/${quotationId}/accept`,{});
  }

  getAcceptedQuotations(): Observable<IQuotation[]>{
    return this.http.get<IQuotation[]>(`${this.editorApiUrl}/quotations?status=accepted`);
  }

  submitQuotationResponse(workData: any): Observable<boolean>{
    return this.http.post<boolean>(`${this.editorApiUrl}/quotations/response`, workData);
  }

  uploadWorkFiles(files: File[]): Observable<FileAttachmentResponse[]>{
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder','Visual Forge/Work Files');
    return this.http.post<FileAttachmentResponse[]>(`${this.editorApiUrl}/uploads/work`, formData,{ reportProgress: true}).pipe(
      catchError(error => { throw error})
    );
  }

  getCompletedWorks(): Observable<CompletedWork[]> {
    return this.http.get<CompletedWork[]>(`${this.editorApiUrl}/works`).pipe(
      catchError(error => { throw error })
    );
  }

  // Bids Services
  createBid(quotationId: string, bidAmount: number, notes?: string): Observable<IBid> {
    return this.http.post<IBid>(`${this.editorApiUrl}/bids`, {
      quotationId,
      bidAmount,
      notes
    });
  }

  getEditorBids(): Observable<IBid[]> {
    return this.http.get<IBid[]>(`${this.editorApiUrl}/bids`);
  }

  updateBid(
    bidId: string, amount: number, notes?: string,
  ): Observable<IBid> {
    return this.http.patch<IBid>(`${this.editorApiUrl}/bids/${bidId}`, {
      bidAmount: amount,
      notes
    });
  }

  deleteBid(bidId: string): Observable<void> {
    return this.http.delete<void>(`${this.editorApiUrl}/bids/${bidId}`);
  }
}
