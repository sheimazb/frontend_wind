import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-gray-100 py-12">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="font-bold text-gray-800 mb-4">Product</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Features</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Integrations</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Pricing</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Enterprise</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Security</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-bold text-gray-800 mb-4">Resources</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Documentation</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Blog</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Community</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Status</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-bold text-gray-800 mb-4">Company</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-600 hover:text-gray-900">About</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Careers</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Press</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Contact</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Partners</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-bold text-gray-800 mb-4">Connect</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Twitter</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">GitHub</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">Discord</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">LinkedIn</a></li>
              <li><a href="#" class="text-gray-600 hover:text-gray-900">YouTube</a></li>
            </ul>
          </div>
        </div>
        
        <div class="mt-12 pt-8 border-t border-gray-200">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <div class="flex items-center mb-4 md:mb-0">
              <svg class="w-8 h-8 mr-2" viewBox="0 0 72 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M36 0L0 66H72L36 0Z" fill="#362D59"/>
              </svg>
              <span class="text-gray-800 font-bold">SENTRY</span>
            </div>
            
            <div class="text-sm text-gray-600">
              &copy; 2025 Sentry. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}