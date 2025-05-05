// Import polyfills first
import './polyfills';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';
import { MarkdownModule, MARKED_OPTIONS } from 'ngx-markdown';
import { marked } from 'marked';
import { WebsocketService } from './app/services/websocket.service';
import { NotificationService } from './app/services/notification.service';
import { PushNotificationsService } from 'ng-push-ivy';

const updatedConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(
      BrowserAnimationsModule
    ),
    importProvidersFrom(
      ToastrModule.forRoot({
        positionClass: 'toast-top-right',
        preventDuplicates: true,
        timeOut: 5000,
        progressBar: true,
        closeButton: true,
        tapToDismiss: true,
        newestOnTop: true
      })
    ),
    importProvidersFrom(
      MarkdownModule.forRoot({
        markedOptions: {
          provide: MARKED_OPTIONS,
          useValue: {
            gfm: true, // GitHub flavored markdown
            breaks: true, // New lines as br elements
            pedantic: false, // Don't be strict about spec compliance
            renderer: new marked.Renderer()
          }
        }
      })
    ),
    WebsocketService,
    NotificationService,
    PushNotificationsService
  ]
};

bootstrapApplication(AppComponent, updatedConfig)
  .catch((err) => console.error(err));