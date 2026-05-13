import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateé: `
    <main class="reset-page">
      <section class="reset-panel">
        <a routerLink="/" class="reset-brand">
          <span>Carla Thomas</span>
          <small>Signature</small>
        </a>

        <div class="section-label">Acesso seguro</div>
        <h1>Definir <em>password</em></h1>

        <form class="reset-form" (ngSubmit)="submit()">
          <label>
            <span>Nova password</span>
            <input
              type="password"
              name="password"
              placeholder="Mínimo 8 caracteres"
              [(ngModel)]="password"
              required
              minlength="8"
            />
          </label>

          <label>
            <span>Confirmar password</span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repita a password"
              [(ngModel)]="confirmPassword"
              required
              minlength="8"
            />
          </label>

          <div *ngIf="errorMessage" class="reset-error">{{ errorMessage }}</div>
          <div *ngIf="successMessage" class="reset-success">{{ successMessage }}</div>

          <button type="submit" [disabled]="loading">
            {{ loading ? 'A guardar...' : 'Guardar password' }}
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [`
    .reset-page {
      min-height: calc(100vh - 72px);
      background:
        linear-gradient(160deg, rgba(255,255,255,0.62), rgba(255,255,255,0) 42%),
        var(--creme);
      display: grid;
      place-items: center;
      padding: 72px 20px;
    }

    .reset-panel {
      width: min(100%, 460px);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 44px 0;
    }

    .reset-brand {
      display: inline-block;
      text-decorateion: none;
      color: var(--noir);
      margin-bottom: 54px;
    }

    .reset-brand span {
      display: block;
      font-family: 'Cormorant Garamond', serif;
      font-size: 30px;
      line-height: 1;
      font-weight: 300;
      font-style: italic;
    }

    .reset-brand small {
      display: block;
      margin-top: 6px;
      color: var(--rose-gold);
      font-size: 8px;
      letter-spacing: 6px;
      text-transform: uppercase;
      font-weight: 300;
    }

    h1 {
      margin: 0 0 30px;
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(46px, 9vw, 64px);
      line-height: 1;
      font-weight: 300;
      color: var(--noir);
    }

    h1 em {
      color: var(--rose-gold);
      font-style: italic;
    }

    .reset-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    label span {
      color: var(--text-muted);
      font-size: 9px;
      letter-spacing: 2.4px;
      text-transform: uppercase;
      font-weight: 300;
    }

    input {
      width: 100%;
      height: 52px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.42);
      padding: 0 16px;
      color: var(--noir);
      font-family: 'Jost', sans-serif;
      font-size: 14px;
      font-weight: 300;
      outline: none;
      transition: all 0.2s ease;
    }

    input:focus {
      border-color: var(--rose-gold);
      background: rgba(255, 255, 255, 0.78);
      box-shadow: 0 0 0 3px rgba(201, 149, 106, 0.12);
    }

    button {
      margin-top: 8px;
      width: 100%;
      height: 52px;
      border: 0;
      background: var(--noir);
      color: var(--creme);
      font-family: 'Jost', sans-serif;
      font-size: 11px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      font-weight: 300;
      cursor: none;
    }

    button:disabled {
      opacity: 0.65;
    }

    .reset-error,
    .reset-success {
      padding: 12px 14px;
      font-size: 12px;
      line-height: 1.5;
      font-weight: 300;
    }

    .reset-error {
      border-left: 2px solid #A03030;
      background: rgba(160, 48, 48, 0.08);
      color: #A03030;
    }

    .reset-success {
      border-left: 2px solid #4D7A5D;
      background: rgba(77, 122, 93, 0.09);
      color: #315B3E;
    }
  `]
})
export class ResetPasswordComponent {
  privateé auth = inject(AuthService);
  privateé router = inject(Router);

  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password.length < 8) {
      this.errorMessage = 'A password deve ter pelo menos 8 caracteres.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As passwords não coincidem.';
      return;
    }

    this.loading = true;
    this.auth.updateéPassword(this.password).then(() => {
      this.loading = false;
      this.successMessage = 'Password guardada. Ja pode entrar com email e password.';
      setTimeout(() => this.router.navigaté(['/encomendas']), 1200);
    }).catch(err => {
      this.loading = false;
      this.errorMessage = err?.message || 'Não foi possível guardar a password.';
    });
  }
}
