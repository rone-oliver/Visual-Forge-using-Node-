import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../interfaces/user.interface';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileAttachmentResponse } from '../../interfaces/quotation.interface';
import { CompletedWork, Works } from '../../interfaces/completed-word.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { };

  getUserProfile(){
    return this.http.get<User>(`${this.apiUrl}/user/profile`).pipe(
      map((response:any)=> {
        console.log(`user profile response: `,response);
        return response;
      }),
      catchError((error)=>{
        console.error('Error fetching user profile:', error);
        throw error;
      })
    );
  }

  requestForEditor(){
    return this.http.post<boolean>(`${this.apiUrl}/user/editorRequest`,{},{withCredentials: true});
  }

  getEditorRequestStatus(): Observable<string | null>{
    return this.http.get<{status: string}>(`${this.apiUrl}/user/editorRequest/status`,{withCredentials: true}).pipe(
      map(response=>response.status),
      catchError(()=> of(null))
    );
  }

  getQuotations(): Observable<any[]>{
    return this.http.get<any[]>(`${this.apiUrl}/user/quotations`).pipe(
      map((response)=>response),
      catchError((error)=> {throw error})
    )
  }

  createQuotation(quotation:any): Observable<boolean>{
    return this.http.post<boolean>(`${this.apiUrl}/user/create-quotation`,{quotation}).pipe(
      map(response=>response),
      catchError(err=>{ throw err})
    )
  }

  updateProfileImage(url: string): Observable<boolean>{
    return this.http.patch<boolean>(`${this.apiUrl}/user/profile-image`,{ url}).pipe(
      map(response=>response),
      catchError(error=>{throw error})
    )
  }

  uploadQuotationFiles(files: File[]): Observable<FileAttachmentResponse[]>{
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder','Visual Forge/Quotation Attachments');
    return this.http.post<FileAttachmentResponse[]>(`${this.apiUrl}/user/quotation/files-upload`, formData,{ reportProgress: true}).pipe(
      catchError(error=> { throw error})
    )
  }

  updateProfile(data: any): Observable<boolean>{
    return this.http.patch<boolean>(`${this.apiUrl}/user/profile/update`, data).pipe(
      map(response=>response),
      catchError(error=>{throw error})
    )
  }

  resetPassword(data: {currentPassword: string, newPassword: string}):Observable<any>{
    return this.http.patch<any>(`${this.apiUrl}/user/reset-password`, data).pipe(
      map(response=>response),
      catchError(error=>{throw error})
    )
  }

  getCompletedWorks(): Observable<CompletedWork[]> {
    return this.http.get<CompletedWork[]>(`${this.apiUrl}/user/quotations/completed`).pipe(
      map((response) => response),
      catchError((error) => { throw error })
    );
  }

  rateWork(workId: string, rating: number, feedback: string): Observable<boolean>{
    console.log('worksId',workId);
    return this.http.post<boolean>(`${this.apiUrl}/user/quotations/rate`, {workId, rating, feedback}).pipe(
      map(response=>response),
      catchError(error=>{throw error})
    )
  }

  rateEditor(editorId: string, rating: number, feedback: string): Observable<boolean>{
    return this.http.post<boolean>(`${this.apiUrl}/user/editor/rate`, {editorId, rating, feedback}).pipe(
      map(response=>response),
      catchError(error=>{throw error})
    )
  }

  getCurrentEditorRating(editorId: string): Observable<{rating: number, feedback: string}>{
    return this.http.get<{rating: number, feedback: string}>(`${this.apiUrl}/user/editor/rating`, {params: {editorId}}).pipe(
      map(response=>response),
      catchError(error=>{throw error})
    )
  }

  updateWorkPublicStatus(workId: string, isPublic: boolean): Observable<boolean> {
    return this.http.patch<boolean>(`${this.apiUrl}/user/quotations/${workId}/public`, { isPublic }).pipe(
        map(response => response),
        catchError(error => { throw error })
    );
  }

  getPublicWorks(page: number, limit: number): Observable<{ works: Works[], total: number }> {
    return this.http.get<{ works: Works[], total: number }>(`${this.apiUrl}/user/works/public`, {
      params: {
        page: page.toString(),
        limit: limit.toString()
      }
    }).pipe(
      map(response => response),
      catchError(error => { throw error })
    );
  }

  getUser(id:string): Observable<User>{
    return this.http.get<User>(`${this.apiUrl}/user/${id}`).pipe(
      map(response=>response),
      catchError(error=>{throw error})
    )
  }
}
