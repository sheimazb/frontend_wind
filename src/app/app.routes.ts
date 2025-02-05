import { Routes } from '@angular/router';
import { LoginComponent } from './authentification/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TesteurDashboardComponent } from './dashboard/testeur-dashboard/testeur-dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
   // { path: 'sidebar', component: SidebarComponent },
    { path: 'dashboard', component: TesteurDashboardComponent },
];

