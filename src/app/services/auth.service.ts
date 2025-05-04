import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

interface LoginRequest {
  phone: string;
  password: string;
}

// Update the LoginResponse interface to match the actual API response
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expireDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService, private router: Router) {}

  // Check if token exists in localStorage
  private hasToken(): boolean {
    return !!localStorage.getItem('accessToken') || 
           !!(localStorage.getItem('currentUser') && 
              JSON.parse(localStorage.getItem('currentUser') || '{}').accessToken);
  }

  // Login method
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>(ApiService.ACCOUNT.LOGIN, credentials).pipe(
      tap(response => {
        if (response && response.accessToken) {
          // Store the entire response in currentUser
          localStorage.setItem('currentUser', JSON.stringify(response));
          // Also store accessToken separately for easier access
          localStorage.setItem('accessToken', response.accessToken);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  // Logout method
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Get current user from localStorage
  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('accessToken') || 
           (this.getCurrentUser()?.accessToken || null);
  }
}
