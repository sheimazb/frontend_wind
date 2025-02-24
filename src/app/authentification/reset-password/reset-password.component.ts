import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router ) {
    this.resetPasswordForm = this.fb.group({
      pin0: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      pin1: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      pin2: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      pin3: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      pin4: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      pin5: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {}

  onPinInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[formControlName=pin${index + 1}]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onPinBackspace(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    
    // If current input is empty and backspace is pressed, focus previous input
    if (!input.value && index > 0) {
      const prevInput = document.querySelector(`input[formControlName=pin${index - 1}]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  isPinInvalid(): boolean {
    return Object.keys(this.resetPasswordForm.controls)
      .filter(key => key.startsWith('pin'))
      .some(key => this.resetPasswordForm.get(key)?.invalid && this.resetPasswordForm.get(key)?.touched);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getFullPin(): string {
    return Object.keys(this.resetPasswordForm.controls)
      .filter(key => key.startsWith('pin'))
      .map(key => this.resetPasswordForm.get(key)?.value)
      .join('');
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    const pin = this.getFullPin();
    const newPassword = this.resetPasswordForm.get('newPassword')?.value;

    this.authService.resetPassword({ code: pin, password: newPassword }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password has been successfully reset!';
        this.router.navigate(['/login']);

      },
      error: (error) => {
        this.isLoading = false;
        if (error.status !== 200 && error.status !== 201) {
          const errorMessage = error.error?.message || 'Registration failed. Please try again.';
          console.log(errorMessage);
        } else {
          console.log('Password has been successfully reset!');
          this.router.navigate(['/login']);
        }
      }
    });
  }
}