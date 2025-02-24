import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4" [class.text-red-600]="data.isDestructive">{{ data.title }}</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-4">
        <button 
          (click)="onCancel()" 
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
          {{ data.cancelText }}
        </button>
        <button 
          (click)="onConfirm()" 
          [class]="data.isDestructive ? 
            'px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700' : 
            'px-4 py-2 text-white bg-purple-500 rounded-md hover:bg-purple-600'">
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
} 