import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AuthService, ChangePasswordRequest } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-settings-profiel',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatIconModule, 
    MatTooltipModule, 
    MatDividerModule, 
    MatMenuModule, 
    RouterModule
  ],
  templateUrl: './dialog-settings-profiel.component.html',
  styleUrl: './dialog-settings-profiel.component.css'
})
export class DialogSettingsProfielComponent implements OnInit {
  changePasswordForm!: FormGroup;
  showPassword: boolean = false;
  public tokenSent: boolean = false;
  public userEmail: string = '';
  public token: string = '';
  public isVerificationCodeRequired: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    public dialogRef: MatDialogRef<DialogSettingsProfielComponent>
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    // Get the current user's email from the AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userEmail = currentUser.email;
    }
  }

  private initializeForm() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onRequestPasswordChange() {
    if (this.changePasswordForm.invalid) {
      return;
    }

    const request: ChangePasswordRequest = {
      email: this.userEmail,
      currentPassword: this.changePasswordForm.get('currentPassword')?.value,
      newPassword: this.changePasswordForm.get('newPassword')?.value
    };

    try {
      const response = await this.authService.requestPasswordChange(request).toPromise();
      console.log('Response from requestPasswordChange:', response);
      this.tokenSent = true;
      this.isVerificationCodeRequired = true;
      console.log('isVerificationCodeRequired set to:', this.isVerificationCodeRequired);
      this.snackBar.open('Verification code sent to your email!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } catch (error: any) {
      console.error('Error during password change request:', error);
      this.snackBar.open(
        error.error || 'Failed to send verification code. Please try again.',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );
    }
  }

  async onVerifyAndChangePassword(token: string) {
    const newPassword = this.changePasswordForm.get('newPassword')?.value;

    try {
      console.log('Attempting to verify and change password...');
      await this.authService.verifyAndChangePassword(token, newPassword).toPromise();
      console.log('Password changed successfully!');
      this.authService.logout(); // Ensure the user is logged out
      console.log('User logged out. Navigating to login page...');
      this.router.navigate(['/login']); // Redirect to the login page
      this.snackBar.open('Password changed successfully!', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.dialogRef.close();
    } catch (error: any) {
      console.error('Error during password change verification:', error);
      console.error('Full error response:', error.response || error); // Log the full error response
      const errorMessage = error.error?.message || 'Failed to change password. Please try again.';
      this.snackBar.open(errorMessage, 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
