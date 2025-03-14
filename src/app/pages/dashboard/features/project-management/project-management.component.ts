import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">Project Management</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4 dark:text-white">Team Management</h2>
          <p class="text-gray-600 dark:text-gray-300">Manage development teams and assign resources.</p>
          <div class="mt-4">
            <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Manage Teams
            </button>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4 dark:text-white">Project Timeline</h2>
          <p class="text-gray-600 dark:text-gray-300">View and adjust project timelines and milestones.</p>
          <div class="mt-4">
            <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              View Timeline
            </button>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4 dark:text-white">Resource Allocation</h2>
          <p class="text-gray-600 dark:text-gray-300">Manage project resources and budget allocation.</p>
          <div class="mt-4">
            <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Allocate Resources
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProjectManagementComponent {} 