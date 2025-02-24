import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';

// Merge the existing appConfig with BrowserAnimationsModule
const updatedConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(BrowserAnimationsModule)
  ]
};

bootstrapApplication(AppComponent, updatedConfig)
  .catch((err) => console.error(err));