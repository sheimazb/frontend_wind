import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Task interface
interface TaskItem {
  title: string;
  description?: string;
  image?: string;
  subtasks: {
    text: string;
    completed: boolean;
  }[];
}

// Dialog Component
@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="p-6 dark:bg-darkbackground">
      <h2 class="text-xl font-bold mb-4  dark:text-white">Create New Task</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1 dark:text-white">Title</label>
        <input 
          type="text" 
          [(ngModel)]="task.title"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="task title"
        >
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-1 dark:text-white">Description</label>
        <textarea 
          [(ngModel)]="task.description"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          rows="3"
          placeholder="description"
        ></textarea>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-1 dark:text-white">Subtasks</label>
        @for (subtask of task.subtasks; track subtask; let i = $index) {
          <div class="flex gap-2 mb-2">
            <input 
              type="text" 
              [(ngModel)]="subtask.text"
              class="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="sub task text"
            >
            <button 
              (click)="removeSubtask(i)"
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>

            </button>
          </div>
        }
        <button 
          (click)="addSubtask()"
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Subtask
        </button>
      </div>

      <div class="flex justify-end gap-4">
        <button 
          (click)="dialogRef.close()"
          class="px-4 py-2 border rounded dark:text-white"
        >
          Cancel
        </button>
        <button 
          (click)="saveTask()"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Create Task
        </button>
      </div>
    </div>
  `
})
export class TaskDialogComponent {
  task: TaskItem = {
    title: '',
    description: '',
    subtasks: [{text: '', completed: false}]
  };

  constructor(public dialogRef: MatDialogRef<TaskDialogComponent>) {}

  addSubtask() {
    this.task.subtasks.push({text: '', completed: false});
  }

  removeSubtask(index: number) {
    this.task.subtasks = this.task.subtasks.filter((_, i) => i !== index);
  }

  saveTask() {
    if (this.task.title) {
      this.dialogRef.close(this.task);
    }
  }
}

// Main Component remains the same
@Component({
  selector: 'app-staff-ticket',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    MatDialogModule,
    TaskDialogComponent
  ],
  templateUrl: './staff-ticket.component.html',
  styleUrl: './staff-ticket.component.css'
})
export class StaffTicketComponent {
  todo: TaskItem[] = [
    {
      title: 'Task title',
      subtasks: [
        { text: 'Here is task one', completed: false },
        { text: 'Here is task Two', completed: true },
        { text: 'Here is task Three', completed: false }
      ]
    }
  ];

  inProgress: TaskItem[] = [];
  completed: TaskItem[] = [];

  constructor(
    private router: Router,
    private dialog: MatDialog
  ) {}

  openNewTaskDialog() {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: TaskItem) => {
      if (result) {
        this.todo.push(result);
      }
    });
  }

  drop(event: CdkDragDrop<TaskItem[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  onDashboardClick() {
    this.router.navigate(['/dashboard/staff']);
  }
}