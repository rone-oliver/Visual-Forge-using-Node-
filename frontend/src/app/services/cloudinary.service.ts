import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly _cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;
  private readonly _uploadPreset = environment.cloudinary.uploadPreset;

  // Services
  private readonly _http = inject(HttpClient);

  constructor() { }

  uploadProfileImage(file: File, username: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this._uploadPreset);
    // formData.append('public_id', `user_${username}`);

    return this._http.post<any>(this._cloudinaryUrl, formData).pipe(
      map(response => response.secure_url)
    )
  }
}
