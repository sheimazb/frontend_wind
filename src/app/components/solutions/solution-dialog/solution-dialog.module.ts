import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MarkdownModule } from 'ngx-markdown';
import { SolutionDialogComponent } from './solution-dialog.component';
import { SolutionFormModule } from '../solution-form/solution-form.module';

@NgModule({
  declarations: [
    SolutionDialogComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    SolutionFormModule,
    MarkdownModule.forChild()
  ],
  exports: [
    SolutionDialogComponent
  ]
})
export class SolutionDialogModule { } 