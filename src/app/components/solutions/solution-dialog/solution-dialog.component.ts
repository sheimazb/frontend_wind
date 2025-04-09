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

    /* Dark mode support */
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
    
    // Ensure scrolling works by configuring the dialog
    this.dialogRef.disableClose = false;
    this.dialogRef.updatePosition({});
    
    // Configure the panelClass to ensure scrolling works correctly
    this.dialogRef.addPanelClass('solution-dialog-scrollable');
  }

  /**
   * Configure the dialog size and styling
   */
  private configureDialogSize(): void {
    this.dialogRef.updateSize('600px', 'auto');
    this.dialogRef.addPanelClass('solution-dialog');
  }

  /**
   * Toggle between normal dialog and full page experience (like Notion)
   */
  toggleDialogWidth(): void {
    this.isFullWidth = !this.isFullWidth;
    
    // Get dialog elements
    const dialogContainer = document.querySelector('.mat-mdc-dialog-container') as HTMLElement;
    const dialogContent = document.querySelector('.mat-mdc-dialog-content') as HTMLElement;
    const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
    const matDialog = document.querySelector('.mat-dialog-container') as HTMLElement;
    
    if (this.isFullWidth) {
      // Apply fullscreen mode
      dialogContainer?.parentElement?.classList.add('fullscreen-mode');
      
      // Add background color classes
      if (dialogContainer) {
        dialogContainer.classList.add('bg-white', 'dark:bg-slate-900');
      }
      
      // Save current body overflow state
      this.originalBodyOverflow = document.body.style.overflow;
      
      // Fix scrolling for material dialog
      if (matDialog) {
        matDialog.style.maxHeight = '100vh';
        matDialog.style.height = '100vh';
        matDialog.classList.add('overflow-hidden');
      }
      
      // Fix for Firefox/Chrome to ensure scrolling works in the content area
      if (dialogContent) {
        // Apply scroll to dialog content instead of body
        dialogContent.style.overflowY = 'auto';
        dialogContent.style.overflowX = 'hidden';
      }
      
      // Increase z-index for overlay
      if (overlayContainer) {
        overlayContainer.classList.add('z-[9999]');
      }
      
      // Set dialog size to full screen
      this.dialogRef.updateSize('100vw', '100vh');
    } else {
      // Remove fullscreen mode
      dialogContainer?.parentElement?.classList.remove('fullscreen-mode');
      
      // Remove background color classes
      if (dialogContainer) {
        dialogContainer.classList.remove('bg-white', 'dark:bg-slate-900');
      }
      
      // Restore body scrolling
      document.body.style.overflow = this.originalBodyOverflow;
      
      // Reset dialog styles
      if (matDialog) {
        matDialog.style.maxHeight = '';
        matDialog.style.height = '';
        matDialog.classList.remove('overflow-hidden');
      }
      
      // Reset content area styles
      if (dialogContent) {
        dialogContent.style.overflowY = '';
        dialogContent.style.overflowX = '';
      }
      
      // Reset z-index
      if (overlayContainer) {
        overlayContainer.classList.remove('z-[9999]');
      }
      
      // Reset dialog size
      this.dialogRef.updateSize('600px', 'auto');
    }
  }

  /**
   * Handle solution save event from the form
   */
  onSolutionSaved(solution: Solution): void {
    this.isSubmitting = true;
    
    // Make sure the dialog doesn't close immediately so we can show errors
    // This prevents the "409 Conflict" error from being swallowed
    setTimeout(() => {
      this.dialogRef.close(solution);
    }, 300);
  }

  /**
   * Handle cancel event from the form
   */
  onCancel(): void {
    this.dialogRef.close();
  }
} 