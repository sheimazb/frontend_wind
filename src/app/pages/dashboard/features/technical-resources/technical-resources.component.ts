import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-technical-resources',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">Technical Resources</h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Documentation Section -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4 dark:text-white">Documentation</h2>
            
            <!-- Documentation categories -->
            <div class="flex flex-wrap gap-2 mb-4">
              <button class="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
                All Docs
              </button>
              <button class="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                API
              </button>
              <button class="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                Frontend
              </button>
              <button class="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                Backend
              </button>
              <button class="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                DevOps
              </button>
            </div>
            
            <!-- Documentation list -->
            <div class="space-y-4">
              <!-- Sample docs - would be ngFor in real implementation -->
              <div class="border dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">API Documentation</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete API reference for the backend services.</p>
                  </div>
                  <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                    API
                  </span>
                </div>
                <div class="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Updated: May 10, 2023</span>
                  <span class="mx-2">•</span>
                  <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">View Documentation</a>
                </div>
              </div>
              
              <div class="border dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Component Library</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">UI component documentation and usage examples.</p>
                  </div>
                  <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                    Frontend
                  </span>
                </div>
                <div class="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Updated: May 5, 2023</span>
                  <span class="mx-2">•</span>
                  <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">View Documentation</a>
                </div>
              </div>
              
              <div class="border dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Deployment Guide</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Step-by-step guide for deploying the application.</p>
                  </div>
                  <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                    DevOps
                  </span>
                </div>
                <div class="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Updated: April 28, 2023</span>
                  <span class="mx-2">•</span>
                  <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">View Documentation</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Resources Section -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4 dark:text-white">Development Tools</h2>
            
            <div class="space-y-3">
              <a href="#" class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <span class="text-blue-600 dark:text-blue-400 text-lg font-bold">G</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">Git Repository</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Access source code</p>
                </div>
              </a>
              
              <a href="#" class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                  <span class="text-purple-600 dark:text-purple-400 text-lg font-bold">J</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">JIRA Board</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Track issues and tasks</p>
                </div>
              </a>
              
              <a href="#" class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <span class="text-green-600 dark:text-green-400 text-lg font-bold">C</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">CI/CD Pipeline</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">View build status</p>
                </div>
              </a>
            </div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4 dark:text-white">Team Resources</h2>
            
            <div class="space-y-3">
              <a href="#" class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                  <span class="text-red-600 dark:text-red-400 text-lg font-bold">M</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">Meeting Notes</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Access team meetings</p>
                </div>
              </a>
              
              <a href="#" class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="w-10 h-10 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-3">
                  <span class="text-yellow-600 dark:text-yellow-400 text-lg font-bold">S</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">Shared Drive</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Access shared files</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TechnicalResourcesComponent {} 