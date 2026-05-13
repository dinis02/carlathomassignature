import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type CookieChoice = 'accepted' | 'declined';

const STORAGE_KEY = 'cts-cookie-consent';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="cookie-banner" *ngIf="visible()" aria-label="Aviso de cookies">
      <div class="cookie-mark">CT</div>

      <div class="cookie-copy">
        <div class="cookie-eyebrow">Privacidade e cookies</div>
        <h2>A sua experi?ncia, com transpar?ncia.</h2>
        <p>
          Usamos cookies essenciais para login, carrinho e checkout. Pode aceitar cookies opcionais
          para futuras melhorias ou continuar apenas com os necess?rios.
        </p>
        <a routerLink="/politica-cookies">Ver Pol?tica de Cookies</a>
      </div>

      <div class="cookie-actions">
        <button type="button" class="btn-secondary" (click)="choose('declined')">Recusar</button>
        <button type="button" class="btn-primary" (click)="choose('accepted')">Aceitar</button>
      </div>
    </aside>
  `,
  styles: [`
    .cookie-banner {
      position: fixed;
      left: 24px;
      right: 24px;
      bottom: 24px;
      z-index: 1000;
      max-width: 940px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 22px;
      align-items: center;
      padding: 22px;
      background: rgba(255, 253, 252, 0.97);
      border: 1px solid rgba(127, 93, 64, 0.18);
      box-shadow: 0 24px 80px rgba(27, 23, 20, 0.18);
      backdrop-filter: blur(14px);
      animation: cookieIn 0.35s ease both;
    }

    .cookie-mark {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--noir);
      color: var(--rose-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px;
      font-style: italic;
      flex-shrink: 0;
    }

    .cookie-eyebrow {
      font-size: 9px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--rose-gold);
      margin-bottom: 6px;
    }

    h2 {
      margin: 0 0 6px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 26px;
      font-weight: 300;
      color: var(--text);
    }

    p {
      margin: 0;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.6;
      font-weight: 200;
    }

    a {
      display: inline-flex;
      margin-top: 9px;
      color: var(--rose-gold);
      text-decorateion: none;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    a:hover {
      color: var(--text);
    }

    .cookie-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    button {
      border: 0;
      height: 44px;
      padding: 0 22px;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
      white-space: nowrap;
    }

    button:hover {
      transform: translateY(-1px);
    }

    .btn-primary {
      background: var(--noir);
      color: var(--creme);
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      color: var(--text);
      border-color: var(--rose-gold);
    }

    @keyframes cookieIn {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 760px) {
      .cookie-banner {
        left: 14px;
        right: 14px;
        bottom: 14px;
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 20px;
      }

      .cookie-mark {
        display: none;
      }

      .cookie-actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      button {
        width: 100%;
        padding: 0 12px;
      }
    }
  `]
})
export class CookieBannerComponent {
  readonly visible = signal(this.shouldShow());

  choose(choice: CookieChoice): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      choice,
      date: new Date().toISOString(),
      version: 1
    }));
    this.visible.set(false);
  }

  private shouldShow(): boolean {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  }
}

