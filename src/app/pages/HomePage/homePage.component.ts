import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { HeroComponent } from './hero/hero.Component';
import { FooterComponent } from './footer/footer.component';
import { bootstrapApplication } from '@angular/platform-browser';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, HeroComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col hide-scrollbar">
      <app-header></app-header>
      <app-hero></app-hero>
      <app-footer></app-footer>
    </div>
  `,
})
export class HomePageComponent {}
bootstrapApplication(HomePageComponent);