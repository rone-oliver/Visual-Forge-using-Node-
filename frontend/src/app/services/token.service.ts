import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly _userTokenKey='userAccessToken';
  private readonly _adminTokenKey='adminAccessToken';

  constructor() { }
  setToken(token: string, userType: 'User' | 'Admin'): void {
    const key = userType === 'User' ? this._userTokenKey : this._adminTokenKey;
    localStorage.setItem(key, token);
  }

  getToken(userType: 'User' | 'Admin'): string | null {
    const key = userType === 'User' ? this._userTokenKey : this._adminTokenKey;
    return localStorage.getItem(key);
  }

  clearToken(userType: 'User' | 'Admin'): void {
    const key = userType === 'User' ? this._userTokenKey : this._adminTokenKey;
    localStorage.removeItem(key);
  }
}
