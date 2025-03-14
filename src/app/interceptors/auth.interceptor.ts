import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Public routes that don't need authentication
  const publicRoutes = [
    'auth/authenticate',
    'auth/login',
    'auth/register',
    'auth/forgot-password',
    'auth/forgot_password',
    'auth/reset-password',
    'auth/reset_password',
    'auth/verify-and-change-password',
    'auth/request-password-change'
  ];

  // Special routes that need token but should not redirect on failure
  const specialRoutes = [
    'auth/logout'
  ];

  // Log the request URL for debugging
  console.log('Request URL:', req.url);
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  console.log('Is public route:', isPublicRoute);
  
  // Check if it's a special route like logout
  const isSpecialRoute = specialRoutes.some(route => req.url.includes(route));
  
  if (isPublicRoute) {
    return next(req);
  }

  // For protected routes, check token
  if (!token && !isSpecialRoute) {
    router.navigate(['/login']);
    return throwError(() => ({
      status: 401,
      message: 'Please login to continue'
    }));
  }

  // Clone the request with auth header
  const modifiedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Log headers for debugging project creation requests
  if (req.url.includes('/projects/create')) {
    console.log('Project creation request headers:', {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
    // Log headers for debugging staff creation requests
    if (req.url.includes('/employees/create-staff')) {
      console.log('Staff creation request headers:', {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }

  console.log('Adding auth header:', {
    url: req.url,
    token: token ? 'Present' : 'Missing',
    headers: modifiedReq.headers.keys()
  });

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('Interceptor error:', error);
      
      if (error.status === 401) {
        localStorage.clear();
        router.navigate(['/login']);
        return throwError(() => ({
          status: 401,
          message: 'Session expired, please login again'
        }));
      }

      if (error.status === 403) {
        return throwError(() => ({
          status: 403,
          message: 'You do not have permission to perform this action'
        }));
      }

      return throwError(() => ({
        status: error.status,
        message: error.error?.message || 'An error occurred'
      }));
    })
  );
}; 