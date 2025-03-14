import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">Development Tasks</h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Task Lists -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4 dark:text-white">My Tasks</h2>
            
            <!-- Task filters -->
            <div class="flex flex-wrap gap-2 mb-4">
              <button class="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
                All Tasks
              </button>
              <button class="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                In Progress
              </button>
              <button class="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                Completed
              </button>
              <button class="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                Pending
              </button>
            </div>
            
            <!-- Task list -->
            <div class="space-y-4">
              <!-- Sample tasks - would be ngFor in real implementation -->
              <div class="border dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Implement User Authentication</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Set up JWT authentication for the API endpoints.</p>
                  </div>
                  <span class="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
                    In Progress
                  </span>
                </div>
                <div class="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Due: May 15, 2023</span>
                  <span class="mx-2">•</span>
                  <span>Priority: High</span>
                </div>
              </div>
              
              <div class="border dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Fix Responsive Layout Issues</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Address layout problems on mobile devices.</p>
                  </div>
                  <span class="px-2.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                    Completed
                  </span>
                </div>
                <div class="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Due: May 10, 2023</span>
                  <span class="mx-2">•</span>
                  <span>Priority: Medium</span>
                </div>
              </div>
              
              <div class="border dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Implement Data Export Feature</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Add CSV and PDF export functionality to reports.</p>
                  </div>
                  <span class="px-2.5 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </div>
                <div class="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Due: May 20, 2023</span>
                  <span class="mx-2">•</span>
                  <span>Priority: Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Task Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4 dark:text-white">Task Summary</h2>
            
            <div class="space-y-4">
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">65%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div class="bg-blue-600 h-2.5 rounded-full" style="width: 65%"></div>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mt-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-blue-700 dark:text-blue-300">3</h3>
                  <p class="text-sm text-blue-600 dark:text-blue-400">In Progress</p>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-green-700 dark:text-green-300">5</h3>
                  <p class="text-sm text-green-600 dark:text-green-400">Completed</p>
                </div>
                
                <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-yellow-700 dark:text-yellow-300">2</h3>
                  <p class="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                </div>
                
                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-red-700 dark:text-red-300">1</h3>
                  <p class="text-sm text-red-600 dark:text-red-400">Overdue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TasksComponent {} 