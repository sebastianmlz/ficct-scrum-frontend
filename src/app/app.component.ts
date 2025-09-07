import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <router-outlet />
    <app-notification />
  `,
  imports: [RouterOutlet, NotificationComponent]
})
export class AppComponent {
  title = 'ficct-scrum-frontend';
}
