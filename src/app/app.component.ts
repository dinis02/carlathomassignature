
import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CursorComponent } from './shared/components/cursor/cursor.component';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, CursorComponent, CookieBannerComponent],
  template: `
    <app-cursor />
    <ng-container *ngIf="!isAdminRoute()">
      <app-header />
    </ng-container>
    <main class="page-wrapper">
      <router-outlet />
    </main>
    <ng-container *ngIf="!isAdminRoute()">
      <app-footer />
      <app-cookie-banner />
    </ng-container>
  `
})
export class AppComponent {
  constructor(private router: Router) {}
  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
