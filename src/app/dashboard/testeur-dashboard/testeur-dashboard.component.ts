import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ContentDashAdminComponent } from "../../components/content/content-dash-admin/content-dash-admin.component";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ContentProjectDashAdminComponent } from '../../components/content/content-project-dash-admin/content-project-dash-admin.component';

@Component({
  selector: 'app-testeur-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent, 
    SidebarComponent, 
    FooterComponent, 
    ContentDashAdminComponent,
    ContentProjectDashAdminComponent
  ],
  templateUrl: './testeur-dashboard.component.html',
  styleUrl: './testeur-dashboard.component.css'
})
export class TesteurDashboardComponent {
  constructor(public router: Router) {}

  get showStats() {
    return this.router.url.includes('stats');
  }
  get showProjects() {
    return this.router.url.includes('project');
  }
}
