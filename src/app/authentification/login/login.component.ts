import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports:[
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatDialogModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  showPassword: boolean = false;
  darkMode: boolean = false;
  loginForm: FormGroup;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  private redirectBasedOnRole() {
    const user = this.authService.getCurrentUser();
    if (user) {
      switch (user.role) {
        case 'PARTNER':
          this.router.navigate(['/dashboard/project']);
          break;
        case 'DEVELOPER':
          this.router.navigate(['/dashboard/tasks']);
          break;
        case 'TESTER':
          this.router.navigate(['/dashboard/issues']);
          break;
        case 'CHEF':
          this.router.navigate(['/dashboard/project-management']);
          break;
        case 'ADMIN':
          this.router.navigate(['/dashboard/agencies']);
          break;
        default:
          this.router.navigate(['/dashboard']);
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignInClick(){
    this.router.navigate(['/dashboard']);
  }
  
  onSignUpClick(){
    this.router.navigate(['/signup']);
  }

  openForgotPasswordDialog() {
    const dialogRef = this.dialog.open(ForgotPasswordComponent, {
      width: '400px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      position: { top: '100px' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle successful password reset request if needed
      }
    });
  }

  // 1. User submits login form
  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
       // 2. Call login API from auth service 
      this.authService.login(this.loginForm.value).subscribe({
        next: (response: LoginResponse) => {
           // 3. Success: Store user data and redirect
          this.isLoading = false;
          this.toastService.showSuccess(`Welcome back, ${response.fullName}!`);
          this.redirectBasedOnRole();
        },
        error: (error) => {
           // 4. Error: Show error message
          this.isLoading = false;
          const errorMessage = error.error?.message || 'Login failed. Please try again.';
          this.toastService.showError(errorMessage);
        }
      });
    } else {
      this.toastService.showError('Please fill in all required fields correctly.');
    }
  }
}
