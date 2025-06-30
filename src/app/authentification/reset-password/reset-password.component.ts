import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="relative bg-[#ffffff] text-white rounded-lg overflow-visible">
      <!-- Icon Container - Positioned above the dialog -->
      <div class="absolute left-1/2 -translate-x-1/2 -top-10">
        <div class="w-24 h-24 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#4F7CFF] flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>

      <!-- Content Container with proper spacing for the icon -->
      <div class="pt-16 px-8 pb-8">
        <!-- Title -->
        <h2 class="text-2xl font-semibold text-[#2B3674] text-center mb-2">Reset Password</h2>
        <div class="space-y-2">
          <p class="text-[#2B3674]/70 text-center text-sm">Enter your verification code and new password.</p>
        </div>

        <!-- Form -->
        <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <!-- PIN Code -->
          <div>
            <label class="block text-sm font-medium text-[#2B3674]/90 mb-2">
              Verification Code
            </label>
            <div class="flex gap-2 justify-center">
              <input *ngFor="let i of [0,1,2,3,4,5]" 
                     type="text" 
                     [formControlName]="'pin' + i"
                     maxlength="1"
                     class="h-11 w-11 rounded-lg  bg-[#dff1fd] border border-[#9ed8ff] text-blue-700 placeholder:text-blue-700/50 text-center text-lg font-bold focus:border-[#569ee1] focus:outline-none focus:ring-2 focus:ring-[#E1567C]/20 transition-all"
                     (input)="onPinInput($event, i)"
                     (keydown)="onPinBackspace($event, i)" />
            </div>
            <div *ngIf="isPinInvalid()" class="mt-2 text-sm text-[#E1567C] text-center">
              Please enter a valid 6-digit code
            </div>
          </div>

          <!-- New Password -->
          <div>
            <label class="block text-sm font-medium text-[#2B3674] mb-2">
              New Password
            </label>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="newPassword"
                placeholder="Enter new password"
                class="w-full h-11 px-4 rounded-lg bg-[#dff1fd] border border-[#9ed8ff] text-blue-700 placeholder:text-blue-700/50 focus:border-[#56bae1] focus:outline-none focus:ring-2 focus:ring-[#E1567C]/20 transition-all text-sm"
              />
              <span (click)="togglePasswordVisibility()" class="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-white/50 hover:text-white/80 transition-colors">
                <svg *ngIf="!showPassword" class="fill-current" width="22" height="22" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <svg *ngIf="showPassword" class="fill-current" width="22" height="22" viewBox="0 0 24 24">
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
              </span>
            </div>
            <div *ngIf="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched" class="mt-2 text-sm text-[#E1567C]">
              <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['required']">Password is required</span>
              <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['minlength']">Password must be at least 8 characters</span>
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-[#2B3674] mb-2">
              Confirm Password
            </label>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Confirm new password"
                class="w-full h-11 px-4 rounded-lg  bg-[#dff1fd] border border-[#9ed8ff] text-blue-700 placeholder:text-blue-700/50 focus:border-[#56c0e1] focus:outline-none focus:ring-2 focus:ring-[#E1567C]/20 transition-all text-sm"
              />
            </div>
            <div *ngIf="resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched" class="mt-2 text-sm text-[#E1567C]">
              <span *ngIf="resetPasswordForm.get('confirmPassword')?.errors?.['required']">Confirm password is required</span>
              <span *ngIf="resetPasswordForm.get('confirmPassword')?.errors?.['passwordMismatch']">Passwords do not match</span>
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
              [disabled]="resetPasswordForm.invalid || isLoading"
              class="w-full h-11 bg-[#4F7CFF] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <svg *ngIf="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Resetting...' : 'Reset Password' }}
            </button>

            <button
              type="button"
              (click)="onCancel()"
              class="w-full text-sm text-[#4F7CFF]/70 hover:text-[#3053bd] transition-colors"
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
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ResetPasswordComponent>,
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      pin0: ['', [Validators.required, Validators.pattern('[0-9]')]],
      pin1: ['', [Validators.required, Validators.pattern('[0-9]')]],
      pin2: ['', [Validators.required, Validators.pattern('[0-9]')]],
      pin3: ['', [Validators.required, Validators.pattern('[0-9]')]],
      pin4: ['', [Validators.required, Validators.pattern('[0-9]')]],
      pin5: ['', [Validators.required, Validators.pattern('[0-9]')]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // No need to check URL parameters anymore as we're using manual code entry
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onPinInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    // Auto focus next input
    if (value.length === 1 && index < 5) {
      const nextInput = input.parentElement?.children[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onPinBackspace(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && index > 0) {
      const currentInput = event.target as HTMLInputElement;
      if (!currentInput.value) {
        const prevInput = currentInput.parentElement?.children[index - 1] as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  }

  isPinInvalid(): boolean {
    const pins = ['pin0', 'pin1', 'pin2', 'pin3', 'pin4', 'pin5'];
    return pins.some(pin => 
      this.resetPasswordForm.get(pin)?.invalid && 
      this.resetPasswordForm.get(pin)?.touched
    );
  }

  getVerificationCode(): string {
    return ['pin0', 'pin1', 'pin2', 'pin3', 'pin4', 'pin5']
      .map(pin => this.resetPasswordForm.get(pin)?.value)
      .join('');
  }

  // Add password match validator
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const verificationCode = this.getVerificationCode();
      const newPassword = this.resetPasswordForm.get('newPassword')?.value;

      this.authService.resetPassword({ 
        code: verificationCode, 
        password: newPassword 
      }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastService.showSuccess('Password reset successful!');
          setTimeout(() => {
            this.dialogRef.close(true);
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastService.showError(error.error?.message || 'Failed to reset password. Please try again.');
        }
      });
    } else {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        const control = this.resetPasswordForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
    this.router.navigate(['/login']);
  }
}