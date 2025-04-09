import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Handles HTTP errors and provides appropriate error messages
   * @param error The HTTP error response
   * @param operation Optional description of the operation that failed
   * @param showNotification Whether to show a notification for this error
   * @returns Observable with error object containing status and message
   */
  handleError(error: HttpErrorResponse, operation?: string, showNotification: boolean = true): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    let statusCode = error.status || 500;

    // Determine the error message based on status code and error response
    if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status === 401) {
      errorMessage = 'Session expired. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (error.status >= 500) {
      errorMessage = 'A server error occurred. Please try again later.';
    } else if (error.error?.message) {
      // Use server-provided error message if available
      errorMessage = error.error.message;
    }

    // Add operation info if provided
    if (operation) {
      errorMessage = `${operation}: ${errorMessage}`;
    }

    // Show notification if requested
    if (showNotification) {
      this.showErrorNotification(errorMessage);
    }

    // Log error to console in development environment only
    if (!this.isProduction()) {
      this.logToConsole(error, operation);
    }

    // Return a standardized error object
    return throwError(() => ({
      status: statusCode,
      message: errorMessage
    }));
  }

  /**
   * Handles generic errors (not just HTTP errors)
   * @param error Any error type
   * @param operation Optional description of the operation that failed
   * @param showNotification Whether to show a notification for this error
   * @returns Observable with error object containing status and message
   */
  handleGenericError(error: unknown, operation?: string, showNotification: boolean = true): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    // Try to extract message from the error
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      // Try to get message from object
      const errorObj = error as Record<string, unknown>;
      if (errorObj['message'] && typeof errorObj['message'] === 'string') {
        errorMessage = errorObj['message'];
      }
    }

    // Add operation info if provided
    if (operation) {
      errorMessage = `${operation}: ${errorMessage}`;
    }

    // Show notification if requested
    if (showNotification) {
      this.showErrorNotification(errorMessage);
    }

    // Log error to console in development environment only
    if (!this.isProduction()) {
      console.error(operation ? `Error during ${operation}:` : 'Error:', error);
    }

    // Return a standardized error object
    return throwError(() => ({
      status: 500, // Generic status code for non-HTTP errors
      message: errorMessage
    }));
  }

  /**
   * Shows a snackbar notification for errors
   */
  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Logs error details to console in non-production environments
   */
  private logToConsole(error: HttpErrorResponse | unknown, operation?: string): void {
    const context = operation ? `Error during ${operation}:` : 'Error:';
    console.error(context, error);
  }

  /**
   * Checks if the application is running in production mode
   */
  private isProduction(): boolean {
    // In a real app, this would check environment.production
    // For this example, we'll always return false to demonstrate development behavior
    return false;
  }
} 