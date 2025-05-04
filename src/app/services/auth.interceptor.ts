import { HttpInterceptorFn, HttpHeaders } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

interface CurrentUser {
  accessToken: string;
  refreshToken: string;
  expireDate: string;
  // Add other user properties as needed
}

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Get token from localStorage with type safety
    const currentUserStr = localStorage.getItem('currentUser');
    let token = localStorage.getItem('accessToken');

    // If token is not directly in localStorage, try to get it from currentUser object
    if (!token && currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr) as CurrentUser;
        token = currentUser.accessToken; // Extract accessToken correctly
      } catch (e) {
        console.error('Error parsing currentUser from localStorage:', e);
      }
    }

    // Only modify request if token exists
    if (token) {
      let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      // Conditionally set Content-Type to application/json if the body is not FormData
      if (!(req.body instanceof FormData)) {
        headers = headers.set('Content-Type', 'application/json');
      }

      const modifiedReq = req.clone({
        headers: headers
      });

      return next(modifiedReq).pipe(
        catchError(error => {
          // Handle specific auth errors here if needed
          if (error.status === 401) {
            authService.logout(); // Log out the user properly
            router.navigate(['/login']); // Redirect to login page
          }

          return throwError(() => error);
        })
      );
    }

    // If no token, proceed with original request
    return next(req);
  } catch (error) {
    // Handle any JSON parsing errors
    console.error('Error in AuthInterceptor:', error);
    return next(req);
  }
};