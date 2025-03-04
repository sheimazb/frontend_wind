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
      <div class="absolute inset-0 bg-[#111036]/30 backdrop-blur-md "></div>
      <div class="container mx-auto px-1 py-1 flex justify-between items-center relative z-10">
        <div class="flex items-center">
          <a href="#" class="text-2xl font-bold flex items-center group">
            <!-- WindLogs Logo -->
            <div class="flex items-center group-hover:scale-105 transition-transform">
              <div class="flex items-center h-16">
                <img 
                  src="assets/darkLogo.png" 
                  alt="WindLogs Logo" 
                  class="h-full w-auto object-contain hover:brightness-110 transition-all duration-300" 
                />
              </div>
            </div>
          </a>  
        </div>
        
        <nav class="hidden lg:flex items-center space-x-8">
          <div class="relative group">
            <a href="#" class="nav-link flex items-center space-x-1">
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
          <a href="#" class="nav-link">PRICING</a>
          <a href="#" class="nav-link">DOCS</a>
          <a href="#" class="nav-link">BLOG</a>
          <a href="#" class="nav-link">SANDBOX</a>
          <a href="#" class="nav-link">MERCH</a>
        </nav>

        <div class="flex items-center space-x-6">
          <a href="/login" class="nav-link">SIGN IN</a>
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
      @apply text-white/75 hover:text-white transition-colors relative py-1;
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
  constructor(private router: Router) {}  

  onSignInClick() {
    this.router.navigate(['/login']);
  }
}