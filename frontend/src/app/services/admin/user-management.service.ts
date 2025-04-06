import { HttpClient } from '@angular/common/http';
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

  getAllUsers():Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl);
  }

  getUser(username: string):Observable<User>{
    return this.http.get<User>(`${this.apiUrl}/${username}`);
  }
}
