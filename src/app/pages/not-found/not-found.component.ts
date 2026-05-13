import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="num">404</div>
      <h1 class="title">P?gina n?o <em>encontrada</em></h1>
      <p class="desc">A p?gina que procura n?o existe ou foi movida.</p>
      <div class="ctas">
        <a routerLink="/" class="btn-primary" style="width:auto;padding:14px 40px;display:inline-flex;">
          <span>Voltar ? homepage</span>
        </a>
        <a routerLink="/produtos" class="btn-ghost">
          Ver produtos
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      min-height: 70vh;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center; padding: 80px 48px;
      animation: fadeUp 0.6s ease both;
    }
    .num {
      font-family: 'Cormorant Garamond', serif;
      font-size: 140px; font-weight: 300; line-height: 1;
      color: var(--creme-dark); margin-bottom: 0;
      letter-spacing: -4px;
    }
    .title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(36px,4vw,56px); font-weight: 300;
      line-height: 1.1; margin-bottom: 16px; margin-top: -16px;
      em { font-style: italic; color: var(--rose-gold); }
    }
    .desc {
      font-size: 14px; color: var(--text-muted);
      font-weight: 200; margin-bottom: 48px; line-height: 1.6;
    }
    .ctas { display: flex; gap: 24px; align-items: center; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  `]
})
export class NotFoundComponent {}

