import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;
  private uploadPreset = environment.cloudinary.uploadPreset;


  constructor(private http: HttpClient) { }

  uploadProfileImage(file: File, username: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    // formData.append('public_id', `user_${username}`);

    return this.http.post<any>(this.cloudinaryUrl, formData).pipe(
      map(response => response.secure_url)
    )
  }
}
