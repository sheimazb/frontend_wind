import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon'; 
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-list',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {
  
}
