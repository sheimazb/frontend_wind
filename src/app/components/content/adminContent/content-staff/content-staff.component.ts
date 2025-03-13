import { Component, inject, OnInit} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {MatTooltipModule} from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import { DialogStaffComponent ,DialogData } from '../../../dialog/dialog-staff/dialog-staff.component';
import { StaffService } from '../../../../services/staff.service';
import { User } from '../../../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-content-staff',
  standalone: true,
  imports: [CommonModule,MatIconModule,FormsModule,MatDividerModule,MatMenuModule,MatFormFieldModule,RouterModule,MatTooltipModule],
  templateUrl: './content-staff.component.html',
  styleUrl: './content-staff.component.css'
})



export class ContentStaffComponent implements OnInit {
  constructor(private router: Router, private staffService: StaffService, private route: ActivatedRoute) {}

  staff: User[] = [];
  filteredStaff: User[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';

  readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadStaff();
   
  }


  loadStaff(): void {
    this.isLoading = true;
    this.staffService.getStaffByPartnerTenant().subscribe((staff) => {
      this.staff = staff;
      this.filteredStaff = staff;
      this.isLoading = false;
    }, (error) => {
      this.errorMessage = 'Failed to load staff. Please try again later.',error;
      this.isLoading = false;
    });
  }

  onSearchStaff(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = searchTerm;

    if (!searchTerm) {
      this.filteredStaff = this.staff;
    } else {
      this.filteredStaff = this.staff.filter(staff => 
        staff.firstname.toLowerCase().includes(searchTerm) ||
        staff.lastname.toLowerCase().includes(searchTerm) ||
        staff.email.toLowerCase().includes(searchTerm)
      );
    }
  }
 
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

  onStaffDetailsClick(id: number) {
    this.router.navigate(['/dashboard/staff-details', id]);
  }
}
