import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule, 
    ReactiveFormsModule,
    HttpClientModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit {
  showPassword: boolean = false;
  darkMode: boolean = false;
  signupForm: FormGroup;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.signupForm = this.formBuilder.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
      this.darkMode = true;
      document.documentElement.classList.add('dark');
    }
  }

  onSignInClick() {
    this.router.navigate(['/login']);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      
      this.authService.register(this.signupForm.value).subscribe({
        next: () => {
          // If we reach here, registration was successful
          this.isLoading = false;
          this.toastService.showSuccess('Registration successful! Please check your email to activate your account.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading = false;
          // Only show error if it's a real error response from the server
          if (error.status !== 200 && error.status !== 201) {
            const errorMessage = error.error?.message || 'Registration failed. Please try again.';
            this.toastService.showError(errorMessage);
          } else {
            // If we get here with status 200/201, it means it was actually successful
            this.toastService.showSuccess('Registration successful! Please check your email to activate your account.');
            this.router.navigate(['/activate-account']);
          }
        }
      });
    } else {
      this.toastService.showError('Please fill in all required fields correctly.');
    }
  }
}
