import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { UserService } from './user/user.service';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private readonly _cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;

  // Services
  private readonly _http = inject(HttpClient);
  private readonly _userService = inject(UserService);

  constructor() {}

  uploadProfileImage(file: File): Observable<string> {
    return this._userService.getUploadSignature().pipe(
      switchMap((signature) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', environment.cloudinary.CLOUDINARY_API_KEY);
        formData.append('signature', signature.signature);
        formData.append('timestamp', signature.timestamp.toString());
        formData.append('upload_preset', signature.uploadPreset)

        return this._http
          .post<any>(this._cloudinaryUrl, formData)
          .pipe(map((response) => response.secure_url));
      }),
    );
  }
}
