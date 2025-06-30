import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingComponentComponent } from '../pricing-component/pricing-component.component';
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule , PricingComponentComponent],
  template: `
    <section 
     [ngClass]="{'dark': darkMode}"
     class="min-h-screen bg-gradient-to-br from-[#bdecff] via-[#f1f5ff] to-[#d9e6ff] dark:bg-gradient-to-br dark:from-[#4f568a] dark:via-[#111036] dark:to-[#111036] pt-20 overflow-y-auto hide-scrollbar relative">
     
      
      <!-- Floating Particles Effect (visible only in light mode) -->
      <div *ngIf="!darkMode" class="particles-container absolute inset-0 pointer-events-none overflow-hidden">
        <div class="particle particle-1"></div>
        <div class="particle particle-2"></div>
        <div class="particle particle-3"></div>
        <div class="particle particle-4"></div>
        <div class="particle particle-5"></div>
      </div>
      
      <!-- Banner -->
      <div class="text-center py-6">
        <a href="#" class="inline-block">
          <div [ngClass]="darkMode ? 'bg-gradient-to-r from-[#E1567C] to-[#9F3996]' : 'bg-gradient-to-r from-[#4F7CFF] to-[#9F6CF7]'" 
               class="text-white px-6 py-3 rounded-md inline-flex items-center hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl">
            <span>Connect with the Windlogs development team on Skype today.</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </div>
        </a>
      </div>

      <!-- Add a subtle radial overlay for extra depth -->
      <div [ngClass]="darkMode ? 
           'bg-gradient-radial from-[#1d1132]/10 via-transparent to-transparent' : 
           'bg-gradient-radial from-[#a2e2fc]/30 via-transparent to-transparent'" 
           class="absolute inset-0 pointer-events-none"></div>

      <div [ngClass]="{'dark': darkMode}" class="container pb-10 mx-auto px-6 pt-16 relative z-10">
        <div class="text-center flex flex-col items-center justify-center gap-10 mb-16">
          <h1 [ngClass]="darkMode ? 'text-white' : 'text-[#2B3674]'" class="hero-title font-bold mb-8 leading-none">
            <span class="inline-block dark:text-white text-[#4F7CFF]">Code</span>
            <span
                  class="breaks-text text-[#3b437a] dark:text-[#4F7CFF] inline-block transform -rotate-12 mx-4 cursor-pointer hover:rotate-0 transition-all duration-500 hover:opacity-100">
              breaks,
            </span>
            <span class="inline-block dark:text-white text-[#4F7CFF]">fix it faster</span>
          </h1>
          
          <p  class="text-center text-lg dark:text-white text-[#3b437a] md:text-xl mb-12 max-w-3xl mx-auto">
            The trusted application monitoring platform powering Windconsulting ERP's success.
          </p>
          
          <div class="flex flex-col md:flex-row justify-center gap-4">
            <a href="#" 
               [ngClass]="darkMode ? 'bg-white hover:bg-gray-100 text-[#2B1D38]' : 'bg-[#526191] hover:bg-[#3A66E0] text-white'" 
               class="px-8 py-3 rounded-md font-semibold text-lg transition-colors shadow-lg hover:shadow-xl">
              START WINDLOGS 
            </a>
           
          </div>
        </div>
        
        <div class="relative max-w-6xl mx-auto">
          <!-- Main content area with warning icons -->
          <div [ngClass]="darkMode ? 'bg-[#362C45]/50' : 'bg-gray-400'" class="backdrop-blur-sm rounded-lg p-6 relative shadow-xl">
            <!-- Warning Icons -->
            <div class="absolute -top-6 right-8 z-10">
              <img src="assets/warning-icon.svg" alt="Warning" class="w-16 h-16 transform rotate-12 drop-shadow-lg" />
              <img src="assets/warning-icon.svg" alt="Warning" class="w-12 h-12 absolute -right-6 top-4 transform -rotate-12 drop-shadow-lg" />
            </div>
            
            <!-- Content Area -->
            <div [ngClass]="darkMode ? 'bg-slate-50' : 'bg-white'" class="rounded-lg overflow-hidden shadow-inner">
              <!-- Issues Header -->
              <div [ngClass]="darkMode ? 'border-black/10' : 'border-gray-200'" class="flex items-center p-4 border-b">
                <span [ngClass]="darkMode ? 'text-black' : 'text-[#2B3674]'" class="text-lg font-medium">Issues</span>
                <svg [ngClass]="darkMode ? 'text-black/50' : 'text-[#535B83]/50'" class="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              
              <!-- Issues Navigation -->
              <div [ngClass]="darkMode ? 'border-black/10' : 'border-gray-200'" class="flex space-x-6 p-4 border-b">
                <a href="#" 
                   [ngClass]="darkMode ? 'text-black/90 border-[#E1567C]' : 'text-[#2B3674] border-[#4F7CFF]'" 
                   class="border-b-2 pb-1 font-medium">Unresolved</a>
                <a href="#" 
                   [ngClass]="darkMode ? 'text-black/50 hover:text-black/90' : 'text-[#535B83]/70 hover:text-[#2B3674]'">For Review</a>
                <a href="#" 
                   [ngClass]="darkMode ? 'text-black/50 hover:text-black/90' : 'text-[#535B83]/70 hover:text-[#2B3674]'">Regressed</a>
                <a href="#" 
                   [ngClass]="darkMode ? 'text-black/50 hover:text-black/90' : 'text-[#535B83]/70 hover:text-[#2B3674]'">Escalating</a>
                <a href="#" 
                   [ngClass]="darkMode ? 'text-black/50 hover:text-black/90' : 'text-[#535B83]/70 hover:text-[#2B3674]'">Archived</a>
              </div>
              
              <!-- Content -->
              <div [ngClass]="darkMode ? 'text-black/30' : 'text-[#535B83]/50'" class="h-[300px] flex items-center justify-center">
                Your application content here
              </div>
            </div>
          </div>
        </div>
      </div>

<!-- pricing section -->
<div class="w-full">
<app-pricing-component id="pricing"></app-pricing-component>
</div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    
    :host {
      display: block;
      font-family: 'Roboto', sans-serif;
    }
    
    /* Theme-specific styles */
    .light-mode {
      background: linear-gradient(radial, circle, #a2e2fc, #2b57b6, #2b57b6);
    }
    
    .dark-mode {
      background: linear-gradient(radial, circle, #4f568a, #111036, #111036);
    }
    
    .hero-title {
      font-size: 96px !important;
      letter-spacing: normal;
      line-height: 1;
      font-weight: 700;
    }
    
    .breaks-text {
      position: relative;
      transition: all 0.3s ease;
    }

    .breaks-text:hover {
      opacity: 1;
      transform: rotate(-0deg) translateY(-1px);
    }

    .breaks-line {
      position: absolute;
      left: 0;
      bottom: -4px;
      width: 100%;
      height: 2px;
      transform: scaleX(0);
      transition: transform 0.3s ease;
      transform-origin: left;
    }

    .breaks-text:hover .breaks-line {
      transform: scaleX(1);
    }
    
    @media (max-width: 768px) {
      .hero-title {
        font-size: 64px !important;
      }
    }
    
    .transform {
      transition: transform 0.3s ease;
    }

    :host ::ng-deep section {
      position: relative;
      overflow-x: hidden;
    }
    
    /* Hide scrollbar for this component while maintaining scroll functionality */
    :host ::ng-deep .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    
    :host ::ng-deep .hide-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    
    /* Particle effects */
    .particles-container {
      z-index: 1;
    }
    
    .particle {
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(135deg, #4F7CFF, #9F6CF7);
      opacity: 0.3;
      animation-timing-function: cubic-bezier(0.55, 0.085, 0.68, 0.53);
      animation-iteration-count: infinite;
      filter: blur(8px);
    }
    
    .particle-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 5%;
      animation: float1 15s infinite;
    }
    
    .particle-2 {
      width: 150px;
      height: 150px;
      top: 60%;
      right: 8%;
      animation: float2 18s infinite;
    }
    
    .particle-3 {
      width: 100px;
      height: 100px;
      bottom: 20%;
      left: 15%;
      animation: float3 20s infinite;
    }
    
    .particle-4 {
      width: 80px;
      height: 80px;
      top: 30%;
      right: 20%;
      animation: float2 12s infinite;
    }
    
    .particle-5 {
      width: 120px;
      height: 120px;
      bottom: 10%;
      right: 30%;
      animation: float1 25s infinite;
    }
    
    @keyframes float1 {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      25% {
        transform: translateY(-30px) translateX(20px);
      }
      50% {
        transform: translateY(15px) translateX(-15px);
      }
      75% {
        transform: translateY(20px) translateX(25px);
      }
    }
    
    @keyframes float2 {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      25% {
        transform: translateY(20px) translateX(-20px);
      }
      50% {
        transform: translateY(-15px) translateX(10px);
      }
      75% {
        transform: translateY(-25px) translateX(-15px);
      }
    }
    
    @keyframes float3 {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      25% {
        transform: translateY(-15px) translateX(-15px);
      }
      50% {
        transform: translateY(25px) translateX(10px);
      }
      75% {
        transform: translateY(10px) translateX(-20px);
      }
    }
  `]
})
export class HeroComponent {
  darkMode = false;
  
  toggleTheme(): void {
    this.darkMode = !this.darkMode;
  }
}