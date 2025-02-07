import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  constructor(private router: Router) {}

  get activeMenu() {
    return this.router.url.includes('stats') 
      ? 'stats' 
      : this.router.url.includes('staff') 
        ? 'staff' 
        : 'dashboard';
  }
  

  onStatsClick() {
    this.router.navigate(['/dashboard/stats']);
  }

    onDashboardClick() {
      this.router.navigate(['/dashboard/project']);
    }

    onStaffClick(){
      this.router.navigate(['/dashboard/staff'])
    }

  }  
