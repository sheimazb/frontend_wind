import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common'; // Import NgIf for conditionals
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [RouterModule, CommonModule, NgIf, FormsModule],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css'
})
export class ActivateAccountComponent  {
  constructor(private router: Router,
    private authService: AuthService

  ) {}

  activationCode: string = ''; 
  activationMessage: string = '';

  activateAccount() {
    if (!this.activationCode) {
      this.activationMessage = 'Please enter the activation code.';
      return;
    }

    this.authService.activateAccount(this.activationCode).subscribe({
      next: (response) => {
        console.log('Component received response:', response);
        // Handle both array and single object responses
        const result = Array.isArray(response) ? response[0] : response;
        
        if (result && result.success) {
          this.activationMessage = result.message || 'Account activated successfully!';
          // Navigate to validation account page after short delay
          setTimeout(() => {
            this.router.navigate(['/validation-account']);
          }, 1500); // 1.5 second delay to show the success message
        } else {
          this.activationMessage = result?.message || 'Something went wrong during activation.';
        }
      },
      error: (error) => {
        console.error('Activation error in component:', error);
        // If it's a 200 status, treat it as success
        if (error.status === 200) {
          this.activationMessage = 'Account activated successfully!';
          setTimeout(() => {
            this.router.navigate(['/validation-account']);
          }, 1500);
        } else {
          this.activationMessage = error.error?.message || 'Invalid activation code. Please try again.';
        }
      }
    });
  }
  
}
