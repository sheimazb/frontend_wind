import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, FormsModule,Validators,FormBuilder  } from '@angular/forms';
import { ContentStaffComponent } from '../../content/content-staff/content-staff.component';
import { ReactiveFormsModule } from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';
import { NgIf } from '@angular/common';
export interface DialogData {
  name: string;
  animal: string;
}
@Component({
  selector: 'app-dialog-staff',
  standalone: true,
  imports: [NgIf,MatRadioModule,ReactiveFormsModule,MatDialogModule,DialogStaffComponent,ContentStaffComponent,FormsModule,MatIconModule,MatButtonModule,MatInputModule,MatFormFieldModule],
  templateUrl: './dialog-staff.component.html',
  styleUrl: './dialog-staff.component.css'
})
export class DialogStaffComponent {
  readonly dialogRef = inject(MatDialogRef<DialogStaffComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log('Form Submitted', formData);
      this.dialogRef.close(formData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
