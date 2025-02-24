import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AuthService, ChangePassword } from '../../../services/auth.service';
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
export class DialogSettingsProfielComponent {
  changePasswordForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    public dialogRef: MatDialogRef<DialogSettingsProfielComponent>  
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onChangePassword() {
    if (this.changePasswordForm.invalid) {
      return;
    }
  
    const passwordData: ChangePassword = {
      currentPassword: this.changePasswordForm.get('currentPassword')?.value,
      newPassword: this.changePasswordForm.get('newPassword')?.value
    };
  
    try {
      const response = await this.authService.changePassword(passwordData).toPromise();
  
      
      if (response && response.status ===200 && response.status=== 201) { 
        this.snackBar.open('Password changed successfully. Please log in again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
  
        this.changePasswordForm.reset();
        this.dialogRef.close();
  
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 500);
      } else {
        this.snackBar.open(response?.message || 'Failed to change password. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    } catch (error: any) {
      if (error.status !== 200 && error.status !== 201) {
        const errorMessage = error.error?.message || 'Failed to change password. Please try again.';
        this.snackBar.open(error?.message || 'Failed to change password. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        console.log(errorMessage);
      } else {
        this.router.navigate(['/login']);
        this.snackBar.open('Password changed successfully. Please log in again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    }
  }
  
}
