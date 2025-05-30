import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Skip Stack Exchange API requests
  if (req.url.includes('api.stackexchange.com')) {
    return next(req);
  }

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
    'auth/request-password-change',
    'auth/activate-account',
    'auth/validation-account'
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

  // Clone request with new headers
  let modifiedReq = req.clone();

  if (token) {
    // Format token properly - remove any existing Bearer prefix first
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const tokenValue = `Bearer ${cleanToken}`;

    // Create headers object
    let headers = req.headers.set('Authorization', tokenValue);

    // Only set Content-Type if not FormData
    if (!(req.body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }

    // Clone the request with headers
    modifiedReq = req.clone({ headers });
  }

  // Debug logging for all requests
  console.log('Request details:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    headers: modifiedReq.headers.keys(),
    authHeader: modifiedReq.headers.get('Authorization'),
    contentType: modifiedReq.headers.get('Content-Type'),
    isFormData: req.body instanceof FormData
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
        // Log additional information for debugging
        console.error('Permission denied:', {
          url: req.url,
          method: req.method,
          userToken: token ? 'Present' : 'Missing',
          headers: modifiedReq.headers.keys(),
          authHeader: modifiedReq.headers.get('Authorization'),
          contentType: modifiedReq.headers.get('Content-Type')
        });

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