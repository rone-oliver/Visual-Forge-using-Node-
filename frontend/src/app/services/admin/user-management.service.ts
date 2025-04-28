import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  profileImage?: string;
  gender?: string;
  age?: number;
  behaviourRating?: number;
  mobileNumber?: string;
  language:string;
  isEditor?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private apiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) { }

  getAllUsers(params?: {[key:string]: any}):Observable<User[]>{
    let httpParams = new HttpParams();
    if(params){
      console.log('params:',params);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<User[]>(this.apiUrl,{ params: httpParams});
  }

  getUser(username: string):Observable<User>{
    return this.http.get<User>(`${this.apiUrl}/${username}`);
  }

  blockUser(userId: string): Observable<boolean> {
    return this.http.patch<boolean>(`${this.apiUrl}/block`,{userId});
  }
}
