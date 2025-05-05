import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="relative bg-[#362C45] text-white rounded-lg overflow-visible">
      <!-- Icon Container - Positioned above the dialog -->
      <div class="absolute left-1/2 -translate-x-1/2 -top-10">
        <div class="w-20 h-20 rounded-full bg-[#E1567C] flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
      </div>

      <!-- Content Container with proper spacing for the icon -->
      <div class="pt-14 px-6 pb-6">
        <!-- Title -->
        <h2 class="text-xl font-semibold text-white text-center mb-2">Forgot Password</h2>
        <p class="text-white/70 text-center text-sm mb-6">Enter your email address and we'll send you a link to reset your password.</p>

        <!-- Form -->
        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="Enter your email"
              class="w-full h-11 px-4 rounded-lg bg-[#2A2438] border border-[#4A4458] text-white placeholder:text-white/50 focus:outline-none focus:border-[#E1567C] transition-colors text-sm"
              [class.border-[#E1567C]]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
            />
            <div *ngIf="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched" class="mt-2 text-sm text-[#E1567C]">
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <!-- Messages -->
          <div *ngIf="successMessage" [@fadeInOut] class="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p class="text-green-400 text-sm">{{ successMessage }}</p>
          </div>

          <div *ngIf="errorMessage" [@fadeInOut] class="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p class="text-red-400 text-sm">{{ errorMessage }}</p>
          </div>

          <!-- Actions -->
          <div class="space-y-3">
            <button
              type="submit"
              [disabled]="forgotPasswordForm.invalid || isLoading"
              class="w-full h-11 bg-[#E1567C] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <svg *ngIf="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>

            <button
              type="button"
              (click)="onCancel()"
              class="w-full text-sm text-white/70 hover:text-white transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private dialogRef: MatDialogRef<ForgotPasswordComponent>,
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  openResetPasswordDialog() {
    const dialogRef = this.dialog.open(ResetPasswordComponent, {
      width: '400px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      position: { top: '100px' }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Reset link has been sent to your email!';
          this.toastService.showSuccess('Reset link has been sent to your email!');
          
          // Close the forgot password dialog and open reset password dialog after a short delay
          setTimeout(() => {
            this.dialogRef.close();
            this.openResetPasswordDialog();
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to send reset link. Please try again.';
          this.toastService.showError(this.errorMessage);
        }
      });
    } else {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        const control = this.forgotPasswordForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
} 