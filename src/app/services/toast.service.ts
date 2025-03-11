import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastr: ToastrService) { }

  showSuccess(message: string): void {
    console.log('Success toast:', message);
    this.toastr.success(message, 'Success');
  }

  showError(message: string): void {
    console.log('Error toast:', message);
    this.toastr.error(message, 'Error');
  }

  showWarning(message: string): void {
    console.log('Warning toast:', message);
    this.toastr.warning(message, 'Warning');
  }

  showInfo(message: string): void {
    console.log('Info toast:', message);
    this.toastr.info(message, 'Info');
  }

  showHttpError(error: any): void {
    console.error('HTTP Error:', error);
    let message = 'An unexpected error occurred';

    if (error.status === 401) {
      message = 'Session expired. Please log in again.';
    } else if (error.status === 403) {
      message = error.message || 'You do not have permission to perform this action.';
    } else if (error.message) {
      message = error.message;
    }

    this.showError(message);
  }
} 