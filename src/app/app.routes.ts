import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard, partnerGuard, testerGuard, chefGuard, developerGuard, technicalTeamGuard } from './guards/role-specific.guards';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  // Public routes (no guards)
  { 
    path: 'login', 
    loadComponent: () => import('./authentification/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'signup', 
    loadComponent: () => import('./authentification/signup/signup.component').then(m => m.SignupComponent) 
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./authentification/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
  
  // Unauthorized page
  { path: 'unauthorized', component: UnauthorizedComponent },
  
  // Protected routes with role-based guards
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Main dashboard - accessible to all authenticated users
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      
      // Admin features
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/dashboard/features/admin/admin.component').then(m => m.AdminComponent)
      },
      
      // Partner routes - using original paths
      {
        path: 'project',
        canActivate: [partnerGuard],
        loadComponent: () => import('./components/content/adminContent/content-project-dash-admin/content-project-dash-admin.component')
          .then(m => m.ContentProjectDashAdminComponent)
      },
      {
        path: 'staff',
        canActivate: [partnerGuard],
        loadComponent: () => import('./components/content/adminContent/content-staff/content-staff.component')
          .then(m => m.ContentStaffComponent)
      },
      {
        path: 'stats',
        canActivate: [partnerGuard],
        loadComponent: () => import('./components/content/adminContent/content-dash-admin/content-dash-admin.component')
          .then(m => m.ContentDashAdminComponent)
      },
      {
        path: 'alert',
        canActivate: [partnerGuard],
        loadComponent: () => import('./components/content/adminContent/content-alert/content-alert.component')
          .then(m => m.ContentAlertComponent)
      },
      {
        path: 'agencies',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/content/systemContent/agencies-content/agencies-content.component').then(m => m.AgenciesContentComponent)
      },
      
      // Project details route
      {
        path: 'project-details/:id',
        canActivate: [partnerGuard],
        loadComponent: () => import('./pages/AdminPages/project-details/project-details.component')
          .then(m => m.ProjectDetailsComponent)
      },
      
      // Project settings route
      {
        path: 'project-settings/:id',
        canActivate: [partnerGuard],
        loadComponent: () => import('./pages/AdminPages/project-settings/project-settings.component')
          .then(m => m.ProjectSettingsComponent)
      },
      
      // Staff details route
      {
        path: 'staff-details/:id',
        canActivate: [partnerGuard],
        loadComponent: () => import('./pages/AdminPages/staff-details/staff-details.component')
          .then(m => m.StaffDetailsComponent)
      },
      
      // Staff ticket route
      {
        path: 'staff-ticket',
        canActivate: [partnerGuard],
        loadComponent: () => import('./pages/AdminPages/staff-ticket/staff-ticket.component')
          .then(m => m.StaffTicketComponent)
      },
      
      // Staff ticket with project ID route
      {
        path: 'staff-ticket/:id',
        canActivate: [partnerGuard],
        loadComponent: () => import('./pages/AdminPages/staff-ticket/staff-ticket.component')
          .then(m => m.StaffTicketComponent)
      },
      
      // Add project route
      {
        path: 'add-project',
        canActivate: [partnerGuard],
        loadComponent: () => import('./pages/AdminPages/add-project/add-project.component')
          .then(m => m.AddProjectComponent)
      },
      
      // Tester routes
      {
        path: 'issues',
        canActivate: [testerGuard],
        loadComponent: () => import('./components/content/testerContent/issues/issues.component')
          .then(m => m.IssuesComponent)
      },
      
      // Chef routes
      {
        path: 'project-management',
        canActivate: [chefGuard],
        loadComponent: () => import('./pages/dashboard/features/project-management/project-management.component')
          .then(m => m.ProjectManagementComponent)
      },
      
      // Developer routes
      {
        path: 'tasks',
        canActivate: [developerGuard],
        loadComponent: () => import('./pages/dashboard/features/tasks/tasks.component')
          .then(m => m.TasksComponent)
      },
      
      // Technical team routes (accessible by developers, testers, and chefs)
      {
        path: 'technical-resources',
        canActivate: [technicalTeamGuard],
        loadComponent: () => import('./pages/dashboard/features/technical-resources/technical-resources.component')
          .then(m => m.TechnicalResourcesComponent)
      },
      
      // Profile route (accessible by all authenticated users)
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  
  // Redirect to login for any unknown routes
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];