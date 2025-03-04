import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gradient-radial from-[#4f568a] via-[#111036] to-[#111036] min-h-screen pt-20">
      <!-- Discord Banner -->
      <div class="text-center py-6">
        <a href="#" class="inline-block">
          <div class="bg-gradient-to-r from-[#E1567C] to-[#9F3996] text-white px-6 py-3 rounded-md inline-flex items-center hover:opacity-90 transition-opacity">
            <span>Connect with the Windlogs development team on Skype today.</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </div>
        </a>
      </div>

      <!-- Add a subtle radial overlay for extra depth -->
      <div class="absolute inset-0 bg-gradient-radial from-[#a888c9]/10 via-transparent to-transparent pointer-events-none"></div>

      <div class="container mx-auto px-6 pt-16 relative z-10">
        <div class="text-center flex flex-col items-center justify-center gap-10 mb-16">
          <h1 class="hero-title text-white font-bold mb-8 leading-none">
            <span class="inline-block">Code</span>
            <span class="breaks-text inline-block transform -rotate-12 mx-4 cursor-pointer hover:rotate-0 transition-all duration-500 text-white hover:opacity-100">
              breaks,
            </span>
            <span class="inline-block">fix it faster</span>
          </h1>
          
          <p class="text-white text-center text-lg md:text-xl mb-12 max-w-3xl mx-auto opacity-90">
            The trusted application monitoring platform powering Windconsulting ERP's success.
          </p>
          
          <div class="flex flex-col md:flex-row justify-center gap-4">
            <a href="#" class="bg-white hover:bg-gray-100 text-[#2B1D38] px-8 py-3 rounded-md font-semibold text-lg transition-colors">
              TRY WINDLOGS FOR FREE
            </a>
            <a href="#" class="border-4 border-[#E1567C] text-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-white/10 transition-colors">
              GET A DEMO
            </a>
          </div>
        </div>
        
        <div class="relative max-w-6xl mx-auto">
          <!-- Main content area with warning icons -->
          <div class="bg-[#362C45]/50 backdrop-blur-sm rounded-lg p-6 relative">
            <!-- Warning Icons -->
            <div class="absolute -top-6 right-8 z-10">
              <img src="assets/warning-icon.svg" alt="Warning" class="w-16 h-16 transform rotate-12" />
              <img src="assets/warning-icon.svg" alt="Warning" class="w-12 h-12 absolute -right-6 top-4 transform -rotate-12" />
            </div>
            
            <!-- Content Area -->
            <div class="bg-slate-50 rounded-lg overflow-hidden">
              <!-- Issues Header -->
              <div class="flex items-center p-4 border-b border-black/10">
                <span class="text-black text-lg font-medium">Issues</span>
                <svg class="w-4 h-4 ml-2 text-black/50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              
              <!-- Issues Navigation -->
              <div class="flex space-x-6 p-4 border-b border-black/10">
                <a href="#" class="text-black/90 border-b-2 border-[#E1567C] pb-1">Unresolved</a>
                <a href="#" class="text-black/50 hover:text-black/90">For Review</a>
                <a href="#" class="text-black/50 hover:text-black/90">Regressed</a>
                <a href="#" class="text-black/50 hover:text-black/90">Escalating</a>
                <a href="#" class="text-black/50 hover:text-black/90">Archived</a>
              </div>
              
              <!-- Content -->
              <div class="h-[300px] flex items-center justify-center text-black/30">
                Your application content here
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    
    :host {
      display: block;
      font-family: 'Roboto', sans-serif;
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
      color: #fff;
    }

    .breaks-line {
      position: absolute;
      left: 0;
      bottom: -4px;
      width: 100%;
      height: 2px;
      background: #E1567C;
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
      overflow: hidden;
    }
  `]
})
export class HeroComponent {}