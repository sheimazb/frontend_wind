import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        <div class="mb-6">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <mat-icon class="text-red-600 dark:text-red-400 text-3xl">warning</mat-icon>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ message || "You don't have permission to access this page. Please contact your manager if you believe this is an error." }}
          </p>
        </div>
        
        <div class="flex gap-3 justify-center">
          <button 
            (click)="goBack()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button 
            (click)="goToDashboard()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AccessDeniedComponent {
  @Input() message?: string;

  constructor(private router: Router) {}

  goBack() {
    window.history.back();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
} 