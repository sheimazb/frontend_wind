import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Solution } from '../../../services/solution.service';

/**
 * Dialog data interface for strong typing
 */
export interface SolutionDialogData {
  ticketId: number;
  existingSolution?: Solution;
}

@Component({
  selector: 'app-solution-dialog',
  templateUrl: './solution-dialog.component.html',
  styles: [`
    .fullscreen-mode {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      border-radius: 0 !important;
      z-index: 9999 !important;
      background-color: white !important;
    }

    
    @media (prefers-color-scheme: dark) {
      .fullscreen-mode {
        background-color: #0f172a !important;
      }
    }
  `]
})
export class SolutionDialogComponent implements OnInit {
  ticketId: number;
  existingSolution?: Solution;
  isSubmitting = false;
  isFullWidth = false;
  originalBodyOverflow: string = '';

  constructor(
    public dialogRef: MatDialogRef<SolutionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolutionDialogData,
    private snackBar: MatSnackBar
  ) {
    this.ticketId = data.ticketId;
    this.existingSolution = data.existingSolution;
  }

  ngOnInit(): void {
    this.configureDialogSize();
    this.originalBodyOverflow = document.body.style.overflow;
    
    
    this.dialogRef.disableClose = false;
    this.dialogRef.updatePosition({});
    
    this.dialogRef.addPanelClass('solution-dialog-scrollable');
  }

 
  private configureDialogSize(): void {
    this.dialogRef.updateSize('600px', 'auto');
    this.dialogRef.addPanelClass('solution-dialog');
  }

 
  toggleDialogWidth(): void {
    this.isFullWidth = !this.isFullWidth;
    
    
    const dialogContainer = document.querySelector('.mat-mdc-dialog-container') as HTMLElement;
    const dialogContent = document.querySelector('.mat-mdc-dialog-content') as HTMLElement;
    const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
    const matDialog = document.querySelector('.mat-dialog-container') as HTMLElement;
    
    if (this.isFullWidth) {
      
      dialogContainer?.parentElement?.classList.add('fullscreen-mode');
      if (dialogContainer) {
        dialogContainer.classList.add('bg-white', 'dark:bg-slate-900');
      }

      this.originalBodyOverflow = document.body.style.overflow;
      
      if (matDialog) {
        matDialog.style.maxHeight = '100vh';
        matDialog.style.height = '100vh';
        matDialog.classList.add('overflow-hidden');
      }
      
      if (dialogContent) {
        dialogContent.style.overflowY = 'auto';
        dialogContent.style.overflowX = 'hidden';
      }
      
      if (overlayContainer) {
        overlayContainer.classList.add('z-[9999]');
      }
      
      this.dialogRef.updateSize('100vw', '100vh');
    } else {
      dialogContainer?.parentElement?.classList.remove('fullscreen-mode');
      
      if (dialogContainer) {
        dialogContainer.classList.remove('bg-white', 'dark:bg-slate-900');
      }
      
      document.body.style.overflow = this.originalBodyOverflow;
      
      if (matDialog) {
        matDialog.style.maxHeight = '';
        matDialog.style.height = '';
        matDialog.classList.remove('overflow-hidden');
      }
      
      if (dialogContent) {
        dialogContent.style.overflowY = '';
        dialogContent.style.overflowX = '';
      }
      
      if (overlayContainer) {
        overlayContainer.classList.remove('z-[9999]');
      }
      this.dialogRef.updateSize('600px', 'auto');
    }
  }

  onSolutionSaved(solution: Solution): void {
    this.isSubmitting = true;
    setTimeout(() => {
      this.dialogRef.close(solution);
    }, 300);
  }

  
  onCancel(): void {
    this.dialogRef.close();
  }
} 