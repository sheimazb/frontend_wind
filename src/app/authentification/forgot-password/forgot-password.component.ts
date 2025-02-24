import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  successMessage: string = '';
  errorMessage: string = '';
  darkMode: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    // Initialize darkMode from localStorage
    const storedDarkMode = localStorage.getItem('darkMode');
    this.darkMode = storedDarkMode ? JSON.parse(storedDarkMode) : false;
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;

      this.authService.forgotPassword({ email }).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Password reset link has been sent to your email';
          this.forgotPasswordForm.reset();
          this.router.navigate(['/reset-password']);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status !== 200 && error.status !== 201) {
            const errorMessage = error.error?.message || 'Password reset link has been sent to your email';
            console.log(errorMessage);
          } else {
            // If we get here with status 200/201, it means it was actually successful
           console.log('Password reset link has been sent to your email');
            this.router.navigate(['/reset-password']);
          }
        }
      });
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
  }
} 