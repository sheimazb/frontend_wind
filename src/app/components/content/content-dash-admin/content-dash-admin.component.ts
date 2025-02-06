import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';

@Component({
  selector: 'app-content-dash-admin',
  standalone: true,
  imports: [MatIconModule,MatMenuModule],
  templateUrl: './content-dash-admin.component.html',
  styleUrl: './content-dash-admin.component.css'
})
export class ContentDashAdminComponent {
 
}
