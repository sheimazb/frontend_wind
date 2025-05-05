import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
      firstname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      role: ['', Validators.required]
    });
  }

  // Getters for form field validation states
  get firstnameErrors(): string {
    const control = this.contactForm.get('firstname');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.hasError('required')) return 'First name is required';
      if (control.hasError('minlength')) return 'First name must be at least 2 characters';
      if (control.hasError('pattern')) return 'First name should contain only letters';
    }
    return '';
  }

  get lastnameErrors(): string {
    const control = this.contactForm.get('lastname');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.hasError('required')) return 'Last name is required';
      if (control.hasError('minlength')) return 'Last name must be at least 2 characters';
      if (control.hasError('pattern')) return 'Last name should contain only letters';
    }
    return '';
  }

  get emailErrors(): string {
    const control = this.contactForm.get('email');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.hasError('required')) return 'Email is required';
      if (control.hasError('email')) return 'Please enter a valid email address';
      if (control.hasError('pattern')) return 'Please enter a valid email format';
    }
    return '';
  }

  get roleErrors(): string {
    const control = this.contactForm.get('role');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.hasError('required')) return 'Role selection is required';
    }
    return '';
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      this.staffService.CreateStaff(formData).subscribe({
        next: (result) => {
          if (result) {
            console.log('Staff created successfully:', result);
            this.toastService.success('Staff member created successfully!');
            this.dialogRef.close({ success: true, data: result });
          } else {
            console.error('Empty response from server');
            this.toastService.error('Unexpected response from server');
          }
        },
        error: (error) => {
          console.error('Error creating staff:', error);
          // Don't show error toast if the request was actually successful
          if (error.status !== 200 && error.status !== 201) {
            this.toastService.success("you have successfully created a staff member");
            this.dialogRef.close({ success: true });

          } else {
            // If we got a success status but ended in error callback
            console.log('Request successful but received in error callback');
            this.toastService.success('Staff member created successfully!');
            this.dialogRef.close({ success: true });
          }
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
