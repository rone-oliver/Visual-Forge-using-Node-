import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly userTokenKey='userAccessToken';
  private readonly adminTokenKey='adminAccessToken';

  constructor() { }
  setToken(token: string, userType: 'User' | 'Admin'): void {
    const key = userType === 'User' ? this.userTokenKey : this.adminTokenKey;
    localStorage.setItem(key, token);
  }

  getToken(userType: 'User' | 'Admin'): string | null {
    const key = userType === 'User' ? this.userTokenKey : this.adminTokenKey;
    return localStorage.getItem(key);
  }

  clearToken(userType: 'User' | 'Admin'): void {
    const key = userType === 'User' ? this.userTokenKey : this.adminTokenKey;
    localStorage.removeItem(key);
  }
}
