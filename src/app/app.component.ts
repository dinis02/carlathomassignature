import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CursorComponent } from './shared/components/cursor/cursor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CursorComponent],
  template: `
    <app-cursor />
    <app-header />
    <main class="page-wrapper">
      <router-outlet />
    </main>
    <app-footer />
  `
})
export class AppComponent {}
