import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { userAuthInterceptor } from './interceptor/user.interceptor';
import { adminAuthInterceptor } from './interceptor/admin.interceptor';
import { editorAuthInterceptor } from './interceptor/editor.interceptor';
import { commonInterceptor } from './interceptor/common.interceptor';
import { tokenInterceptor } from './interceptor/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([
      commonInterceptor,
      tokenInterceptor,
      adminAuthInterceptor,
      editorAuthInterceptor,
      userAuthInterceptor,
    ])),
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
