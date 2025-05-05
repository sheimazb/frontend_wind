import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ActivateAccountComponent } from '../activate-account/activate-account.component';
import { ValidationAccountComponent } from '../validation-account/validation-account.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule, 
    ReactiveFormsModule,
    HttpClientModule,
    MatDialogModule,
    ActivateAccountComponent,
    ValidationAccountComponent
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
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    this.signupForm = this.formBuilder.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchingValidator
    });
  }

  // Custom validator to check if password and confirm password match
  passwordMatchingValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordsNotMatching: true };
    }
    return null;
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
      
      // Remove confirmPassword before sending to API
      const formData = { ...this.signupForm.value };
      delete formData.confirmPassword;
      
      this.authService.register(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.openActivationDialog();
          this.toastService.showSuccess('Registration successful! Please activate your account.');
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status !== 200 && error.status !== 201) {
            const errorMessage = error.error?.message || 'Registration failed. Please try again.';
            this.toastService.showError(errorMessage);
          } else {
            this.openActivationDialog();
            this.toastService.showSuccess('Registration successful! Please activate your account.');
          }
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        const control = this.signupForm.get(key);
        control?.markAsTouched();
      });
      this.toastService.showError('Please fill in all required fields correctly.');
    }
  }

  openValidationDialog() {
    const dialogRef = this.dialog.open(ValidationAccountComponent, {
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

  openActivationDialog() {
    const dialogRef = this.dialog.open(ActivateAccountComponent, {
      width: '400px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      position: { top: '100px' }
    });
  }
}