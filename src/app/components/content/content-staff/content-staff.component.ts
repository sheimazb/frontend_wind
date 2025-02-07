import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, RouterModule } from '@angular/router';
import {MatTooltipModule} from '@angular/material/tooltip';
import {
 
  MatDialog,
  
} from '@angular/material/dialog';
import { DialogStaffComponent ,DialogData } from '../../dialog/dialog-staff/dialog-staff.component';

@Component({
  selector: 'app-content-staff',
  standalone: true,
  imports: [MatIconModule,MatDividerModule,MatMenuModule,MatFormFieldModule,RouterModule,MatTooltipModule],
  templateUrl: './content-staff.component.html',
  styleUrl: './content-staff.component.css'
})



export class ContentStaffComponent {
  constructor(private router: Router) {}

  readonly dialog = inject(MatDialog);

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogStaffComponent, {
      width: '400px', // Optional: Adjust dialog size
      data: { name: '', animal: '' } as DialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog result:', result);
      if (result) {
        console.log(`Saved Data: Name = ${result.name}, Animal = ${result.animal}`);
      }
    });
  } 

  onStaffDetailsClick() {
    this.router.navigate(['/dashboard/staff-details']);
  }
}
