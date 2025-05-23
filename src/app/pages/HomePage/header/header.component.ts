import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="fixed w-full z-50">
      <!-- Glossy background effect -->
      <div class="absolute inset-0 bg-transparent backdrop-blur-md" [ngClass]="{'bg-black/50': isDarkMode}"></div>
      <div class="container mx-auto px-1 py-1 flex justify-between items-center relative z-10">
        <div class="flex items-center">
          <a href="#" class="text-2xl font-bold flex items-center group">
            <!-- WindLogs Logo -->
            <div class="flex items-center group-hover:scale-105 transition-transform">
              <div class="flex items-center h-16">
                <img 
                  [src]="isDarkMode ? 'assets/darkLogo.png' : 'assets/darkLogo.png'" 
                  alt="WindLogs Logo" 
                  class="h-full w-auto object-contain hover:brightness-110 transition-all duration-300" 
                />
              </div>
            </div>
          </a>  
        </div>
        
        <nav class="hidden lg:flex items-center space-x-8">
          <div class="relative group">
            <a href="#" class="nav-link flex items-center space-x-1" [ngClass]="{'text-white/75 hover:text-white': isDarkMode, 'text-[#111036]/75 hover:text-[#111036]': !isDarkMode}">
                <span>PRODUCT</span>
              <svg class="w-4 h-4 transform transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </a>
            <!-- Dropdown hover effect -->
            <div class="absolute hidden group-hover:block pt-2 -ml-4">
              <div class="bg-[#111036]/90 backdrop-blur-md rounded-md py-2 px-4 space-y-2 min-w-[160px] shadow-xl border border-white/10">
                <a href="#" class="block text-white/75 hover:text-white transition-colors">Features</a>
                <a href="#" class="block text-white/75 hover:text-white transition-colors">Solutions</a>
                <a href="#" class="block text-white/75 hover:text-white transition-colors">Enterprise</a>
              </div>
            </div>
          </div>
          <a href="#" class="nav-link" [ngClass]="{'text-white/75 hover:text-white': isDarkMode, 'text-[#111036]/75 hover:text-[#111036]': !isDarkMode}">PRICING</a>
          <a href="#" class="nav-link" [ngClass]="{'text-white/75 hover:text-white': isDarkMode, 'text-[#111036]/75 hover:text-[#111036]': !isDarkMode}">DOCS</a>
          <a href="#" class="nav-link" [ngClass]="{'text-white/75 hover:text-white': isDarkMode, 'text-[#111036]/75 hover:text-[#111036]': !isDarkMode}">BLOG</a>   
        </nav>

        <div class="flex items-center space-x-6">
          <!-- Dark Mode Toggle -->
          <button (click)="toggleDarkMode()" class="p-2 rounded-full" [ngClass]="{'bg-gray-800 text-yellow-300': isDarkMode, 'bg-gray-200 text-gray-700': !isDarkMode}">
            <svg *ngIf="!isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg *ngIf="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          
          <a href="/login" class="nav-link" [ngClass]="{'text-white/75 hover:text-white': isDarkMode, 'text-[#111036]/75 hover:text-[#111036]': !isDarkMode}">SIGN IN</a>
          <a href="#" class="bg-white/90 hover:bg-white text-[#111036] px-4 py-2 rounded-md font-medium transition-all duration-200 hover:shadow-lg hover:shadow-white/20">
            GET STARTED
          </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }

    .nav-link {
      @apply transition-colors relative py-1;
    }

    .nav-link::after {
      content: '';
      @apply absolute left-0 right-0 bottom-0 h-[2px] bg-[#E1567C] transform scale-x-0 transition-transform duration-200;
    }

    .nav-link:hover::after {
      @apply scale-x-100;
    }
  `]
})
export class HeaderComponent {
  isDarkMode = false;
  
  constructor(private router: Router) {
    // Check if dark mode was previously set
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      this.isDarkMode = true;
      this.applyDarkMode();
    }
  }  

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.applyDarkMode();
  }
  
  private applyDarkMode() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  onSignInClick() {
    this.router.navigate(['/login']);
  }
}