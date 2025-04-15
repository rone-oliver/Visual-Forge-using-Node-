import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../interfaces/user.interface';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

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
        console.log(`user profile response: ${response}`);
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
}
