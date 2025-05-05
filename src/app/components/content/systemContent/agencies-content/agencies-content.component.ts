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
import { FormsModule } from '@angular/forms';
import { PartnerAccountStatusRequest } from '../../../../models/partner.model';

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
    FormsModule,
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
  // Search and filter properties
  searchEmail: string = '';
  statusFilter: string = 'all'; // 'all', 'active', or 'blocked'
  
  constructor(private adminService: AdminService, private router: Router) {}
  
  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.adminService.getAllPartners().subscribe({
      next: (partners) => {
        // Sort partners by ID in descending order (newest first)
        this.allPartners = partners.sort((a, b) => {
          return b.id - a.id; // Sort by ID in descending order
        });
        this.updateTotalPages();
        this.updateDisplayedPartners();
        console.log('Partners loaded successfully', partners);
      },
      error: (error) => {
        console.error('Error loading partners', error);
      },
    });
  }
  
  // Search partners by email
  searchPartners(): void {
    if (!this.searchEmail || this.searchEmail.trim() === '') {
      // If search is empty, show all partners
      this.updateTotalPages();
      this.currentPage = 1;
      this.updateDisplayedPartners();
      return;
    }
    
    const filteredPartners = this.allPartners.filter(partner => 
      partner.email && partner.email.toLowerCase().includes(this.searchEmail.toLowerCase())
    );
    
    this.totalPages = Math.ceil(filteredPartners.length / this.pageSize);
    this.currentPage = 1;
    this.partners = filteredPartners.slice(0, this.pageSize);
  }
  
  // Clear search and reset to show all partners
  clearSearch(): void {
    this.searchEmail = '';
    this.statusFilter = 'all';
    this.updateTotalPages();
    this.currentPage = 1;
    this.updateDisplayedPartners();
  }

  // Update total pages based on all partners
  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.allPartners.length / this.pageSize);
  }
  
  // Update the displayed partners based on current page, search, and status filter
  updateDisplayedPartners(): void {
    let partnersToDisplay = this.allPartners;
    
    // Apply search filter if search is active
    if (this.searchEmail && this.searchEmail.trim() !== '') {
      partnersToDisplay = partnersToDisplay.filter(partner => 
        partner.email && partner.email.toLowerCase().includes(this.searchEmail.toLowerCase())
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      partnersToDisplay = partnersToDisplay.filter(partner => 
        partner.accountLocked === !isActive
      );
    }
    
    this.totalPages = Math.ceil(partnersToDisplay.length / this.pageSize);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, partnersToDisplay.length);
    this.partners = partnersToDisplay.slice(startIndex, endIndex);
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

  updateAccountStatus(email: string, status: boolean): void {
    const request: PartnerAccountStatusRequest = { accountLocked: status };
    
    this.adminService.updatePartnerAccountStatus(email, request).subscribe({
      next: (response) => {
        console.log('Mise à jour réussie:', response);
        this.loadPartners(); // Rafraîchir la liste après modification
      },
      error: (err) => console.error('Erreur lors de la mise à jour du statut', err)
    });
  }
  
  onRegisterPartnerClick(): void {
    this.router.navigate(['/dashboard/register-partner']);
  }

  // Filter by status
  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.updateDisplayedPartners();
  }
}