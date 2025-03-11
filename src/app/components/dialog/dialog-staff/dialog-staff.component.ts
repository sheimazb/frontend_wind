import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
  import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material Modules
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

// Services
import { StaffService } from '../../../services/staff.service';
import { ToastService } from '../../../services/toast.service';
import { ToastrService } from 'ngx-toastr';

export interface DialogData {
  name: string;
  animal: string;
}

@Component({
  selector: 'app-dialog-staff',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    ReactiveFormsModule
  ],
  templateUrl: './dialog-staff.component.html',
  styleUrl: './dialog-staff.component.css'
})
export class DialogStaffComponent {
  readonly dialogRef = inject(MatDialogRef<DialogStaffComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private toastService: ToastrService,
    private router: Router
  ) {
    this.contactForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      this.staffService.CreateStaff(formData).subscribe({
        next: (result) => {
          console.log('Staff created:', result);
          this.toastService.success('Staff member created successfully!');
          this.router.navigate(['/dashboard/staff']);
        },
        error: (error) => {
          this.toastService.error(error.message || 'Failed to create staff member. Please try again.');
        }
      });
    } else {
      this.markFormFieldsTouched();
      this.toastService.error('Please fill in all required fields correctly.');
    }
  }

  private markFormFieldsTouched(): void {
    Object.values(this.contactForm.controls).forEach(control => control.markAsTouched());
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}
