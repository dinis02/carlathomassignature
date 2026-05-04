import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountSession, AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-modal-backdrop" (click)="close()"></div>
    <aside class="login-modal" role="dialog" aria-modal="true" aria-label="Conta">
      <button type="button" class="login-close" aria-label="Fechar" (click)="close()">×</button>

      <div class="login-brand">
        <span class="login-brand-main">Carla Thomas</span>
        <span class="login-brand-sub">Signature</span>
      </div>

      <div class="login-heading">
        <div class="section-label">{{ mode === 'login' ? 'Acesso privado' : 'Nova cliente' }}</div>
        <h2>{{ mode === 'login' ? 'Entrar na sua' : 'Criar a sua' }} <em>conta</em></h2>
      </div>

      <div class="login-tabs" aria-label="Tipo de acesso">
        <button type="button" [class.active]="mode === 'login'" (click)="setMode('login')">Entrar</button>
        <button type="button" [class.active]="mode === 'register'" (click)="setMode('register')">Criar conta</button>
      </div>

      <form class="login-form" (ngSubmit)="submit()">
        <label *ngIf="mode === 'register'" class="login-field">
          <span>Nome</span>
          <input type="text" placeholder="Maria Silva" [(ngModel)]="name" name="name" required />
        </label>

        <label class="login-field">
          <span>{{ mode === 'login' ? 'Usuario ou email' : 'Email' }}</span>
          <input type="text" placeholder="cliente@email.com" [(ngModel)]="username" name="username" required />
        </label>

        <label class="login-field">
          <span>Senha</span>
          <input type="password" placeholder="••••••••" [(ngModel)]="password" name="password" required />
        </label>

        <div *ngIf="loginError" class="login-error">{{ errorMessage }}</div>

        <button class="login-submit" type="submit" [disabled]="loading">
          <span>
            {{ loading ? 'A processar...' : (mode === 'login' ? 'Entrar' : 'Criar conta') }}
          </span>
        </button>

        <button type="button" class="login-switch" (click)="setMode(mode === 'login' ? 'register' : 'login')">
          {{ mode === 'login' ? 'Ainda nao tem conta? Criar conta' : 'Ja tem conta? Entrar' }}
        </button>
      </form>

      <div class="login-footer-note">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div>
          <strong>Pagamento seguro</strong>
          <span>Conta protegida e dados guardados com cuidado.</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .login-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(26, 23, 20, 0.42);
      backdrop-filter: blur(10px);
      z-index: 1001;
      animation: loginFade 0.25s ease both;
    }

    .login-modal {
      position: fixed;
      top: 0;
      right: 0;
      width: min(100vw, 460px);
      height: 100vh;
      background:
        linear-gradient(160deg, rgba(255,255,255,0.54), rgba(255,255,255,0) 42%),
        var(--creme);
      z-index: 1002;
      box-shadow: -24px 0 80px rgba(26, 23, 20, 0.18);
      display: flex;
      flex-direction: column;
      padding: 42px;
      overflow-y: auto;
      animation: loginSlide 0.32s ease both;
    }

    .login-close {
      position: absolute;
      top: 20px;
      right: 22px;
      width: 36px;
      height: 36px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--noir);
      font-size: 26px;
      line-height: 1;
      font-family: 'Cormorant Garamond', serif;
      cursor: none;
      transition: all 0.2s ease;
    }

    .login-close:hover {
      border-color: var(--noir);
      background: var(--noir);
      color: var(--creme);
    }

    .login-brand {
      margin-bottom: 78px;
      padding-right: 44px;
    }

    .login-brand-main {
      display: block;
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      line-height: 1;
      font-weight: 300;
      font-style: italic;
      color: var(--noir);
    }

    .login-brand-sub {
      display: block;
      margin-top: 6px;
      color: var(--rose-gold);
      font-size: 8px;
      letter-spacing: 6px;
      text-transform: uppercase;
      font-weight: 300;
    }

    .login-heading {
      margin-bottom: 28px;
    }

    .login-heading h2 {
      margin: 0;
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(42px, 9vw, 58px);
      line-height: 1;
      font-weight: 300;
      color: var(--noir);
    }

    .login-heading h2 em {
      color: var(--rose-gold);
      font-style: italic;
    }

    .login-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid var(--border);
      margin-bottom: 28px;
    }

    .login-tabs button {
      height: 44px;
      border: 0;
      background: transparent;
      color: var(--text-muted);
      font-family: 'Jost', sans-serif;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 300;
      cursor: none;
      transition: all 0.2s ease;
    }

    .login-tabs button.active {
      background: var(--noir);
      color: var(--creme);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }

    .login-field {
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .login-field span {
      color: var(--text-muted);
      font-size: 9px;
      letter-spacing: 2.4px;
      text-transform: uppercase;
      font-weight: 300;
    }

    .login-field input {
      width: 100%;
      height: 50px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.32);
      padding: 0 16px;
      color: var(--noir);
      font-family: 'Jost', sans-serif;
      font-size: 14px;
      font-weight: 300;
      outline: none;
      cursor: none;
      transition: all 0.2s ease;
    }

    .login-field input::placeholder {
      color: rgba(138, 126, 116, 0.58);
    }

    .login-field input:focus {
      border-color: var(--rose-gold);
      background: rgba(255, 255, 255, 0.72);
      box-shadow: 0 0 0 3px rgba(201, 149, 106, 0.12);
    }

    .login-submit {
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
      position: relative;
      overflow: hidden;
      transition: opacity 0.2s ease;
    }

    .login-submit::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--rose-gold);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .login-submit:hover::before {
      transform: translateX(0);
    }

    .login-submit span {
      position: relative;
      z-index: 1;
    }

    .login-submit:disabled {
      opacity: 0.65;
    }

    .login-switch {
      align-self: center;
      border: 0;
      background: transparent;
      color: var(--text-muted);
      font-family: 'Jost', sans-serif;
      font-size: 10px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 300;
      cursor: none;
      padding: 4px 0;
      transition: color 0.2s ease;
    }

    .login-switch:hover {
      color: var(--rose-gold);
    }

    .login-error {
      border-left: 2px solid #A03030;
      background: rgba(160, 48, 48, 0.08);
      color: #A03030;
      padding: 12px 14px;
      font-size: 12px;
      line-height: 1.5;
      font-weight: 300;
    }

    .login-footer-note {
      margin-top: auto;
      padding-top: 34px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
    }

    .login-footer-note svg {
      color: var(--rose-gold);
      flex: 0 0 auto;
      margin-top: 2px;
    }

    .login-footer-note strong {
      display: block;
      color: var(--noir);
      font-size: 12px;
      font-weight: 300;
      margin-bottom: 3px;
    }

    .login-footer-note span {
      display: block;
      font-size: 12px;
      line-height: 1.5;
      font-weight: 200;
    }

    @media (max-width: 520px) {
      .login-modal {
        width: 100vw;
        padding: 34px 24px;
      }

      .login-brand {
        margin-bottom: 56px;
      }
    }

    @keyframes loginFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes loginSlide {
      from { opacity: 0; transform: translateX(28px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class LoginModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() loginResult = new EventEmitter<AccountSession>();

  private auth = inject(AuthService);

  mode: 'login' | 'register' = 'login';
  name = '';
  username = '';
  password = '';
  loginError = false;
  loading = false;
  errorMessage = 'Usuario ou senha invalidos';

  close(): void {
    this.closeModal.emit();
  }

  setMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.loginError = false;
  }

  submit(): void {
    this.loginError = false;
    this.loading = true;

    const request = this.mode === 'login'
      ? this.auth.login(this.username, this.password)
      : this.auth.register(this.name, this.username, this.password);

    request.subscribe({
      next: session => {
        this.loading = false;
        this.loginResult.emit(session);
      },
      error: err => {
        this.loading = false;
        this.loginError = true;
        this.errorMessage = err?.error?.error || 'Usuario ou senha invalidos';
      }
    });
  }
}
