import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ValidationAccountComponent } from '../validation-account/validation-account.component';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule
  ],
  template: `
    <div class="relative bg-[#362C45] text-white rounded-lg overflow-visible">
      <!-- Icon Container - Positioned above the dialog -->
      <div class="absolute left-1/2 -translate-x-1/2 -top-20">
        <div class="w-24 h-24 rounded-full bg-gradient-to-r from-[#E1567C] to-[#9F3996] flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
      </div>

      <!-- Content Container with proper spacing for the icon -->
      <div class="pt-16 px-8 pb-8">
        <!-- Title -->
        <h2 class="text-2xl font-semibold text-white text-center mb-2">Activate Your Account</h2>
        <p class="text-white/70 text-center text-sm mb-8">Please enter the activation code sent to your email</p>

        <!-- Form -->
        <form class="space-y-6">
          <div>
            <label for="activationCode" class="block text-sm font-medium text-white/90 mb-2">
              Activation Code
            </label>
            <input
              type="text"
              id="activationCode"
              name="activationCode"
              [(ngModel)]="activationCode"
              placeholder="Enter your activation code"
              class="w-full h-12 px-4 rounded-lg bg-[#111036]/50 border border-white/10 text-white placeholder:text-white/30 focus:border-[#E1567C] focus:outline-none focus:ring-2 focus:ring-[#E1567C]/20 transition-all text-sm"
            />
          </div>

          <!-- Message -->
          <div *ngIf="activationMessage" class="text-sm text-center" [ngClass]="{'text-green-400': isSuccess, 'text-[#E1567C]': !isSuccess}">
            {{ activationMessage }}
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex justify-center items-center py-2">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-[#E1567C] border-t-transparent"></div>
          </div>

          <!-- Actions -->
          <div class="space-y-4">
            <button
              (click)="activateAccount()"
              type="button"
              [disabled]="!activationCode || isLoading"
              class="w-full h-12 bg-gradient-to-r from-[#E1567C] to-[#9F3996] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              Activate Account
            </button>

            <button
              (click)="onCancel()"
              type="button"
              class="block w-full text-sm text-white/70 hover:text-white transition-colors text-center py-2"
            >
              Back to Sign Up
            </button>
          </div>
        </form>
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
export class ActivateAccountComponent {
  activationCode: string = ''; 
  activationMessage: string = '';
  isSuccess: boolean = false;
  isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ActivateAccountComponent>,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  activateAccount() {
    if (!this.activationCode) {
      this.activationMessage = 'Please enter your activation code';
      this.isSuccess = false;
      return;
    }

    this.isLoading = true;
    this.authService.activateAccount(this.activationCode).subscribe({
      next: (response) => {
        const result = Array.isArray(response) ? response[0] : response;
        
        if (result && result.success) {
          this.isSuccess = true;
          this.activationMessage = result.message || 'Account activated successfully!';
          setTimeout(() => {
            this.dialogRef.close();
            this.openValidationDialog();
          }, 1000);
        } else {
          this.activationMessage = result?.message || 'Something went wrong during activation.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        if (error.status === 200) {
          this.isSuccess = true;
          this.activationMessage = 'Account activated successfully!';
          setTimeout(() => {
            this.dialogRef.close();
            this.openValidationDialog();
          }, 1000);
        } else {
          this.activationMessage = error.error?.message || 'Invalid activation code. Please try again.';
          this.isLoading = false;
        }
      }
    });
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

  onCancel(): void {
    this.dialogRef.close(false);
  }
}