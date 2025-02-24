import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, FormsModule, Validators, FormBuilder } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { NgIf, CommonModule, NgClass } from '@angular/common';
import { StaffService } from '../../../services/staff.service';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';

export interface DialogData {
  name: string;
  animal: string;
}

@Component({
  selector: 'app-dialog-staff',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgClass,
    MatRadioModule,
    ReactiveFormsModule,
    MatDialogModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule
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
    private toastService: ToastService,
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
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess(response.message || 'Staff member created successfully!');
            this.dialogRef.close({ success: true, data: formData });
            setTimeout(() => {
              this.router.navigate(['/dashboard/staff']);
            }, 100);
          } else {
            this.toastService.showError('Failed to create staff member. Please try again.');
          }
        },
        error: (error) => {
          this.toastService.showError(error.message || 'Failed to create staff member. Please try again.');
        }
      });
    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
      this.toastService.showError('Please fill in all required fields correctly.');
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}
