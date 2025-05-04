import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      
      const userRole = this.authService.getUserRole();
if (route.data.roles && !route.data.roles.includes(userRole)) {
  this.router.navigate(['/unauthorized']); // Redirect to unauthorized page instead of home
  return false;
}

      // authorised so return true
      return true;
    }

    // not logged in so redirect to login page
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
} 