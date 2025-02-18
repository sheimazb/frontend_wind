import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor() { }

  showSuccess(message: string): void {
    // You can implement this using your preferred toast library
    // For example: ngx-toastr, or a custom implementation
    console.log('Success:', message);
    alert(message); // Temporary implementation
  }

  showError(message: string): void {
    // You can implement this using your preferred toast library
    console.log('Error:', message);
    alert(message); // Temporary implementation
  }
} 