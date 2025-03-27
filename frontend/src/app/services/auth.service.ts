import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private backendUrl = 'http://localhost:5000';
  constructor(private http: HttpClient) { };

  adminLogin(username: string, password: string):Observable<any>{
    return this.http.post(`${this.backendUrl}/auth/admins/login`, {username, password},httpOptions);
  }
  adminRegister(adminData:any):Observable<any>{
    return this.http.post(`${this.backendUrl}/auth/admins/register`, adminData,httpOptions);
  }
}
