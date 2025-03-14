import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/role.enum';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="flex overflow-hidden dark:bg-slate-950 bg-[#ECF8F6] pt-16">
      <app-sidebar></app-sidebar>

      <div
        id="main-content"
        class="h-full w-full dark:bg-slate-950 relative overflow-y-auto lg:ml-24"
      >
        <div class="flex flex-col min-h-screen">
          <main class="flex-grow">
            <router-outlet></router-outlet>
          </main>
          <app-footer class="mt-auto"></app-footer>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardLayoutComponent implements OnInit {
  userRole: Role | null = null;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role as Role || null;
  }
} 