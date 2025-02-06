import { Routes } from '@angular/router';
import { LoginComponent } from './authentification/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TesteurDashboardComponent } from './dashboard/testeur-dashboard/testeur-dashboard.component';
import { ContentDashAdminComponent } from './components/content/content-dash-admin/content-dash-admin.component';
import { ContentProjectDashAdminComponent } from './components/content/content-project-dash-admin/content-project-dash-admin.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { 
        path: 'dashboard', 
        component: TesteurDashboardComponent,
        children: [
            { path: '', component: TesteurDashboardComponent },
            { path: 'stats', component: ContentDashAdminComponent },
            { path: 'project', component: ContentProjectDashAdminComponent }

        ]
    }
];

