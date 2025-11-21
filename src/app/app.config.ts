import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimationsAsync}
  from '@angular/platform-browser/animations/async';
import {provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi,
  withInterceptors} from '@angular/common/http';
import {routes} from './app.routes';
import {AuthInterceptor} from './core/interceptors/auth.interceptor';
import {aiDeduplicationInterceptor} from
  './core/interceptors/ai-deduplication.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
        withInterceptorsFromDi(),
        withInterceptors([aiDeduplicationInterceptor]),
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
};
