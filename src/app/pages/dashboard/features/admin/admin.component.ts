import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-feature',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">Admin Panel</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4 dark:text-white">Agencies Management</h2>
          <p class="text-gray-600 dark:text-gray-300">Manage partner agencies and their access.</p>
          <div class="mt-4">
            <a routerLink="/dashboard/agencies" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors inline-block">
              Manage Agencies
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminComponent {} 