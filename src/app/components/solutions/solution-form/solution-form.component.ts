import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Solution, ComplexityLevel, SolutionStatus } from '../../../services/solution.service';

@Component({
  selector: 'app-solution-form',
  templateUrl: './solution-form.component.html',
  styles: [`
    .markdown-body {
      line-height: 1.6;
    }
    
    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    
    .markdown-body a {
      color: #3b82f6;
      text-decoration: underline;
    }
    
    .markdown-body code {
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
      padding: 2px 4px;
      font-family: monospace;
    }
    
    .markdown-body pre code {
      display: block;
      padding: 1rem;
      overflow-x: auto;
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .dark .markdown-body pre code {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class SolutionFormComponent implements OnInit {
  @Input() existingSolution?: Solution;
  @Input() ticketId?: number;
  @Input() solution?: Solution;
  @Output() solutionSaved = new EventEmitter<Solution>();
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('markdownEditor') markdownEditor!: ElementRef<HTMLTextAreaElement>;

  solutionForm: FormGroup;
  selectedFiles: File[] = [];
  isLoading = false;
  showPreview = true; // Show preview by default
  
  // Make enums available to template
  ComplexityLevel = ComplexityLevel;
  complexityLevels = Object.values(ComplexityLevel);

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.solutionForm = this.createSolutionForm();
  }

  ngOnInit(): void {
    // Use solution input if provided, otherwise use existingSolution
    const solutionToUse = this.solution || this.existingSolution;
    
    if (solutionToUse) {
      this.patchFormWithSolution(solutionToUse);
    }
  }

  /**
   * Creates and configures the solution form with validators
   */
  private createSolutionForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(50)]],
      complexity: [ComplexityLevel.MEDIUM, Validators.required],
      estimatedTime: [0, [Validators.required, Validators.min(0)]],
      costEstimation: [0, [Validators.required, Validators.min(0)]],
      category: ['DEFAULT', Validators.required]
    });
  }

  /**
   * Patches form values with solution data
   */
  private patchFormWithSolution(solution: Solution): void {
    this.solutionForm.patchValue({
      title: solution.title,
      content: solution.content,
      complexity: solution.complexity || ComplexityLevel.MEDIUM,
      estimatedTime: solution.estimatedTime || 0,
      costEstimation: solution.costEstimation || 0,
      category: solution.category || 'DEFAULT'
    });
  }

  /**
   * Patches existing solution values to the form
   * @deprecated Use patchFormWithSolution instead
   */
  private patchFormValues(): void {
    if (!this.existingSolution) return;
    this.patchFormWithSolution(this.existingSolution);
  }

  /**
   * Toggle markdown preview panel visibility
   */
  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  /**
   * Insert markdown syntax at cursor position in the editor
   */
  insertMarkdown(markdownSyntax: string): void {
    if (!this.markdownEditor) return;
    
    const textarea = this.markdownEditor.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    
    // If text is selected, wrap it with the markdown syntax
    // Otherwise, just insert the syntax at the cursor position
    let replacement = '';
    
    if (selected) {
      if (markdownSyntax === '**bold**') {
        replacement = `**${selected}**`;
      } else if (markdownSyntax === '*italic*') {
        replacement = `*${selected}*`;
      } else if (markdownSyntax === '# Heading') {
        replacement = `# ${selected}`;
      } else if (markdownSyntax === '- List item') {
        replacement = `- ${selected}`;
      } else if (markdownSyntax === '[Link](https://example.com)') {
        replacement = `[${selected}](https://example.com)`;
      } else if (markdownSyntax === '```\ncode\n```') {
        replacement = `\`\`\`\n${selected}\n\`\`\``;
      } else {
        replacement = markdownSyntax;
      }
    } else {
      replacement = markdownSyntax;
    }
    
    const after = text.substring(end);
    const newValue = before + replacement + after;
    
    // Update the form control value
    this.solutionForm.get('content')?.setValue(newValue);
    
    // Focus and set cursor position
    textarea.focus();
    
    // Set selection to after inserted markdown
    const newCursorPosition = start + replacement.length;
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  }

  /**
   * Handle tab key in textarea for proper indentation
   */
  handleTab(event: Event): void {
    // Cast to KeyboardEvent, which we know it is because of the keydown.tab binding
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Tab') {
      keyboardEvent.preventDefault();
      
      const textarea = this.markdownEditor.nativeElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab character
      const newValue = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      this.solutionForm.get('content')?.setValue(newValue);
      
      // Set cursor position after tab
      textarea.focus();
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  }

  /**
   * Sync scrolling between editor and preview
   */
  syncScroll(): void {
    // Optional feature - can be implemented to sync scrolling between 
    // editor and preview when scroll positions need to be synchronized
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.solutionForm.invalid) {
      this.handleInvalidForm();
      return;
    }
    
    this.isLoading = true;
    
    // Get the current user data
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    
    // Create solution object with all required fields
    const solution: Solution = this.prepareSolutionData(userData);
    
    console.log('Preparing to save solution:', solution);
    
    // Create FormData for file uploads if needed
    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    // Add solution data to FormData
    formData.append('solution', JSON.stringify(solution));
    
    // Emit the solution data
    this.solutionSaved.emit(solution);
    
    // Clear loading state after a timeout to ensure the spinner shows
    // This is because the parent component will handle the API call
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  /**
   * Prepares the solution data object from form values and user data
   */
  private prepareSolutionData(userData: any): Solution {
    const formValues = this.solutionForm.value;
    
    return {
      // Include existing ID if updating
      ...(this.existingSolution?.id ? { id: this.existingSolution.id } : {}),
      
      // Required fields with defaults
      title: formValues.title || 'New Solution',
      content: formValues.content || 'Solution details',
      complexity: formValues.complexity || ComplexityLevel.MEDIUM,
      status: SolutionStatus.SUBMITTED,
      estimatedTime: formValues.estimatedTime || 0,
      costEstimation: formValues.costEstimation || 0,
      category: formValues.category || 'DEFAULT',
      
      // User and tenant information
      authorUserId: userData?.id || 1,
      tenant: userData?.tenant || 'default',
      
      // Ticket reference
      ticket: { id: this.ticketId || this.existingSolution?.ticket?.id || 0 }
    };
  }

  /**
   * Handles invalid form submission by marking fields as touched
   */
  private handleInvalidForm(): void {
    // Mark all form controls as touched to show validation errors
    Object.keys(this.solutionForm.controls).forEach(key => {
      const control = this.solutionForm.get(key);
      control?.markAsTouched();
    });
    
    this.snackBar.open('Please fix the form errors before submitting', 'Dismiss', {
      duration: 5000
    });
  }

  /**
   * Handles file selection
   */
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files) {
      for (let i = 0; i < element.files.length; i++) {
        this.selectedFiles.push(element.files[i]);
      }
    }
  }

  /**
   * Removes a file from the selectedFiles array
   */
  removeFile(file: File): void {
    const index = this.selectedFiles.indexOf(file);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    }
  }

  /**
   * Handles cancellation of the form
   */
  onCancel(): void {
    this.cancel.emit();
  }
} 