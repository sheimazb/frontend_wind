import { Routes } from '@angular/router';
import { LoginComponent } from './authentification/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TesteurDashboardComponent } from './dashboard/testeur-dashboard/testeur-dashboard.component';
import { ContentDashAdminComponent } from './components/content/content-dash-admin/content-dash-admin.component';
import { ContentProjectDashAdminComponent } from './components/content/content-project-dash-admin/content-project-dash-admin.component';
import { ProjectSettingsComponent } from './pages/project-settings/project-settings.component';
import { AddProjectComponent } from './pages/add-project/add-project.component';
import { ContentStaffComponent } from './components/content/content-staff/content-staff.component';
import { StaffDetailsComponent } from './pages/staff-details/staff-details.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { 
        path: 'dashboard', 
        component: TesteurDashboardComponent,
        children: [
            { path: '', component: TesteurDashboardComponent },
            { path: 'stats', component: ContentDashAdminComponent },
            { path: 'project', component: ContentProjectDashAdminComponent },
            { path: 'project-settings', component: ProjectSettingsComponent },
            { path: 'add-project', component: AddProjectComponent },
            { path: 'staff', component: ContentStaffComponent },
            { path: 'staff-details', component: StaffDetailsComponent },




        ]
    }
];

