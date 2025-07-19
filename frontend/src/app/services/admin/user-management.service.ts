import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger.service';

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

export interface UserResponse {
  users: User[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly _apiUrl = `${environment.apiUrl}/admin/users`;

  // Services
  private readonly _http = inject(HttpClient);
  private readonly _logger = inject(LoggerService);

  constructor() { }

  getAllUsers(params?: Record<string, any>):Observable<UserResponse>{
    let httpParams = new HttpParams();
    if(params){
      this._logger.debug('params:',params);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this._http.get<UserResponse>(this._apiUrl,{ params: httpParams});
  }

  getUser(username: string):Observable<User>{
    return this._http.get<User>(`${this._apiUrl}/${username}`);
  }

  blockUser(userId: string): Observable<boolean> {
    return this._http.patch<boolean>(`${this._apiUrl}/${userId}/block`,{});
  }
}
