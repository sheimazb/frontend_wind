import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-validation-account',
  standalone: true,
  imports: [RouterModule, CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="relative bg-[#ffffff] text-white rounded-lg overflow-visible">
      <!-- Icon Container - Positioned above the dialog -->
      <div class="absolute left-1/2 -translate-x-1/2 -top-20">
        <div class="w-24 h-24 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#4F7CFF] flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <!-- Content Container with proper spacing for the icon -->
      <div class="pt-16 px-8 pb-8">
        <!-- Title -->
        <h2 class="text-2xl font-semibold text-[#2B3674] text-center mb-2">Account Validated!</h2>
        <div class="space-y-2">
          <p class="text-[#2B3674]/90 text-center">Your account has been successfully created.</p>
          <p class="text-[#2B3674]/70 text-center text-sm">Please wait for admin approval to access your account.</p>
        </div>

        <!-- Action Button -->
        <div class="mt-8">
          <button 
            (click)="returnToLogin()"
            class="w-full h-12 bg-gradient-to-r from-[#4F7CFF] to-[#4F7CFF] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class ValidationAccountComponent {
  constructor(
    private dialogRef: MatDialogRef<ValidationAccountComponent>,
    private router: Router
  ) {}

  returnToLogin() {
    this.dialogRef.close();
    this.router.navigate(['/login']);
  }
}
