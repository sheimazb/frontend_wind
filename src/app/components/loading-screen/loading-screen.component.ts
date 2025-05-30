import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('in => out', animate('500ms ease-in-out')),
      transition('out => in', animate('500ms ease-in-out'))
    ]),
    trigger('slideUp', [
      state('void', style({
        transform: 'translateY(30px)',
        opacity: 0
      })),
      transition('void => *', animate('600ms ease-out'))
    ])
  ]
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
  progress = 0;
  currentStep = 0;
  animationState = 'in';
  isDarkMode = false;
  
  loadingSteps = [
    'Initializing WindLogs',
    'Loading user data',
    'Preparing dashboard',
    'Almost ready...'
  ];

  private progressInterval: any;
  private redirectTimer: any;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadThemePreference();
    this.startLoading();
    
    // Auto redirect after loading completes
    this.redirectTimer = setTimeout(() => {
      this.completeLoading();
    }, 8000);
  }

  ngOnDestroy() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  private startLoading() {
    let currentProgress = 0;
    
    this.progressInterval = setInterval(() => {
      // Smooth progress increment
      currentProgress += Math.random() * 3 + 1;
      this.progress = Math.min(currentProgress, 100);
      
      // Update current step based on progress
      if (this.progress < 25) {
        this.currentStep = 0;
      } else if (this.progress < 50) {
        this.currentStep = 1;
      } else if (this.progress < 75) {
        this.currentStep = 2;
      } else {
        this.currentStep = 3;
      }
      
      if (this.progress >= 100) {
        clearInterval(this.progressInterval);
      }
    }, 100);
  }

  private completeLoading() {
    this.animationState = 'out';
    setTimeout(() => {
      this.redirectBasedOnRole();
    }, 500);
  }

  private loadThemePreference() {
    const savedTheme = localStorage.getItem('windlogs-theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('windlogs-theme', this.isDarkMode ? 'dark' : 'light');
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
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}