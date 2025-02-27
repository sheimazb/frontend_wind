import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { diAngularOriginal } from '@ng-icons/devicon/original';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../../services/admin.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agencies-content',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatCheckboxModule,
    NgIcon,
  ],
  templateUrl: './agencies-content.component.html',
  styleUrl: './agencies-content.component.css',
  viewProviders: [provideIcons({ diAngularOriginal })],
})
export class AgenciesContentComponent implements OnInit {
  partners: any[] = [];
  allPartners: any[] = [];
  Math = Math;
  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  
  constructor(private adminService: AdminService) {}
  
  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.adminService.getAllPartners().subscribe({
      next: (partners) => {
        this.allPartners = partners;
        this.totalPages = Math.ceil(this.allPartners.length / this.pageSize);
        this.updateDisplayedPartners();
        console.log('Partners loaded successfully', partners);
      },
      error: (error) => {
        console.error('Error loading partners', error);
      },
    });
  }
  
  // Update the displayed partners based on current page
  updateDisplayedPartners(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.allPartners.length);
    this.partners = this.allPartners.slice(startIndex, endIndex);
  }
  
  // Go to previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedPartners();
    }
  }
  
  // Go to next page
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedPartners();
    }
  }
  
  // Go to a specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedPartners();
    }
  }
  
  // Get array of page numbers to display in pagination
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
    if (this.totalPages <= maxPagesToShow) {
      // If we have fewer than maxPagesToShow pages, show all of them
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Otherwise show a window of pages around the current page
      let startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(startPage + maxPagesToShow - 1, this.totalPages);
      
      // Adjust startPage if endPage is capped
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  // Check if we should show the ellipsis at the start
  shouldShowStartEllipsis(): boolean {
    return this.getPageNumbers()[0] > 1;
  }
  
  // Check if we should show the ellipsis at the end
  shouldShowEndEllipsis(): boolean {
    const pages = this.getPageNumbers();
    return pages[pages.length - 1] < this.totalPages;
  }
}