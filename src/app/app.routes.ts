import { Routes } from '@angular/router';
import { LoginComponent } from './authentification/login/login.component';
import { ContentDashAdminComponent } from './components/content/adminContent/content-dash-admin/content-dash-admin.component';
import { ContentProjectDashAdminComponent } from './components/content/adminContent/content-project-dash-admin/content-project-dash-admin.component';
import { ProjectSettingsComponent } from './pages/AdminPages/project-settings/project-settings.component';
import { AddProjectComponent } from './pages/AdminPages/add-project/add-project.component';
import { ContentStaffComponent } from './components/content/adminContent/content-staff/content-staff.component';
import { StaffDetailsComponent } from './pages/AdminPages/staff-details/staff-details.component';
import { StaffTicketComponent } from './pages/AdminPages/staff-ticket/staff-ticket.component';
import { ContentAlertComponent } from './components/content/adminContent/content-alert/content-alert.component';
import { AdminComponent } from './dashboard/admin/admin.component';
import { TesterComponent } from './dashboard/tester/tester.component';
import { IssuesComponent } from './components/content/testerContent/issues/issues.component';
import { IssuePageComponent } from './pages/TesterPages/issue-page/issue-page.component';
import { SignupComponent } from './authentification/signup/signup.component';
import { ActivateAccountComponent } from './authentification/activate-account/activate-account.component';
import { ValidationAccountComponent } from './authentification/validation-account/validation-account.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ForgotPasswordComponent } from './authentification/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './authentification/reset-password/reset-password.component';
import { AgenciesContentComponent } from './components/content/systemContent/agencies-content/agencies-content.component';
import { HomePageComponent } from './pages/HomePage/homePage.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { ProjectDetailsComponent } from './pages/AdminPages/project-details/project-details.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'activate-account', component: ActivateAccountComponent },
  { path: 'validation-account', component: ValidationAccountComponent },
  {path:'forgot-password',component:ForgotPasswordComponent},
  { path: 'reset-password', component: ResetPasswordComponent },

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
            { path: 'project-settings/:id', component: ProjectSettingsComponent },
            { path: 'add-project', component: AddProjectComponent },
            { path: 'project-details/:id', component: ProjectDetailsComponent },
            { path: 'staff', component: ContentStaffComponent },
            { path: 'staff-details/:id', component: StaffDetailsComponent },
            { path: 'staff-ticket', component: StaffTicketComponent },
            { path: 'alert', component: ContentAlertComponent },
            { path: 'profile', component: ProfileComponent },


          ]
        },
        {
          path: 'dashboardTesteur',
          component: TesterComponent,
          children: [
            { 
              path: '',
              redirectTo: 'issues',
              pathMatch: 'full'  // Added pathMatch for redirect
            },
            { path: 'issues', component: IssuesComponent },
            { path: 'issue-details', component: IssuePageComponent },


          ]

        },
        {
          path: 'dashboardAdmin',
          component: TesterComponent,
          children: [
            { 
              path: '',
              redirectTo: 'agencies',
              pathMatch: 'full'  // Added pathMatch for redirect
            },
            { path: 'agencies', component: AgenciesContentComponent },

          ]

        },
        {
          path: 'unauthorized',
          component: UnauthorizedComponent
        }
      ];