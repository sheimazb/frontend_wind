import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="error-card">
        <h1>403 - Unauthorized Access</h1>
        <p>You do not have permission to access this resource.</p>
        <p>Please contact your administrator if you believe this is an error.</p>
        <button (click)="goBack()" class="back-button">Go Back</button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    .error-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #dc3545;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
      margin-bottom: 0.5rem;
    }
    .back-button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .back-button:hover {
      background-color: #0056b3;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack() {
    window.history.back();
  }
} 