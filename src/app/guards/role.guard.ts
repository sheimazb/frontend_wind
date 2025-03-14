import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/role.enum';

export const roleGuard = (allowedRoles: Role[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // First check if the user is authenticated
    if (!authService.isLoggedIn()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get the current user
    const currentUser = authService.getCurrentUser();
    
    // Check if user has any of the required roles
    if (currentUser && allowedRoles.includes(currentUser.role as Role)) {
      return true;
    }

    // If user doesn't have the required role, redirect to unauthorized page
    router.navigate(['/unauthorized']);
    return false;
  };
}; 