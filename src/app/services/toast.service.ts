import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastr: ToastrService) { }

  showSuccess(message: string): void {
    console.log('Attempting to show success toast:', message);
    this.toastr.success(message, 'Success');
  }

  showError(message: string): void {
    console.log('Attempting to show error toast:', message);
    this.toastr.error(message, 'Error');
  }
} 