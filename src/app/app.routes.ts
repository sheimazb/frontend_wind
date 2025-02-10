import { Routes } from '@angular/router';
import { LoginComponent } from './authentification/login/login.component';
import { ContentDashAdminComponent } from './components/content/content-dash-admin/content-dash-admin.component';
import { ContentProjectDashAdminComponent } from './components/content/content-project-dash-admin/content-project-dash-admin.component';
import { ProjectSettingsComponent } from './pages/project-settings/project-settings.component';
import { AddProjectComponent } from './pages/add-project/add-project.component';
import { ContentStaffComponent } from './components/content/content-staff/content-staff.component';
import { StaffDetailsComponent } from './pages/staff-details/staff-details.component';
import { StaffTicketComponent } from './pages/staff-ticket/staff-ticket.component';
import { ContentAlertComponent } from './components/content/content-alert/content-alert.component';
import { AdminComponent } from './dashboard/admin/admin.component';
import { TesterComponent } from './dashboard/tester/tester.component';


 export const routes: Routes = [
        { path: '', redirectTo: '/login', pathMatch: 'full' },
        { path: 'login', component: LoginComponent },
        {
          path: 'dashboard',
          component: AdminComponent,
          children: [
            { 
              path: '',
              redirectTo: 'project',
              pathMatch: 'full'  // Added pathMatch for redirect
            },
            { path: 'stats', component: ContentDashAdminComponent },
            { path: 'project', component: ContentProjectDashAdminComponent },
            { path: 'project-settings', component: ProjectSettingsComponent },
            { path: 'add-project', component: AddProjectComponent },
            { path: 'staff', component: ContentStaffComponent },
            { path: 'staff-details', component: StaffDetailsComponent },
            { path: 'staff-ticket', component: StaffTicketComponent },
            { path: 'alert', component: ContentAlertComponent }
          ]
        },
        {
          path: 'dashboardTesteur',
          component: TesterComponent,
          children: [
            { 
              path: '',
              redirectTo: 'project',
              pathMatch: 'full'  // Added pathMatch for redirect
            },
          ]

        }
      ];