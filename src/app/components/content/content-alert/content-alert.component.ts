import { Component } from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-content-alert',
  standalone: true,
  imports: [MatTooltipModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatFormFieldModule
  ],
  templateUrl: './content-alert.component.html',
  styleUrl: './content-alert.component.css'
})
export class ContentAlertComponent {

}
