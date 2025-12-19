// jwt.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  // This is the token from your question. In a real app, you would get this from a secure storage (like a login service).
  private token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjIzNDUwNX0.FVsVZmwRIL8u60bbTuQXzf9HcMG9DpLQqNbc4URjBjqXKvejncyehlrl2zZqEm8D0cgmPboi57431MfcDrNhtw';

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request and add the Authorization header with the Bearer token
    const authReq = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.token}`
      }
    });

    // Pass the cloned request to the next handler
    return next.handle(authReq);
  }
}