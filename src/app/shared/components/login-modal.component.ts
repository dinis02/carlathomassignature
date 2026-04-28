import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-modal-backdrop" (click)="close()"></div>
    <div class="login-modal">
      <h2>Login</h2>
      <div>
        <input type="text" placeholder="Usuário ou Email" [(ngModel)]="username" name="username" required />
        <input type="password" placeholder="Senha" [(ngModel)]="password" name="password" required />
        <div class="login-actions">
          <button type="button" (click)="login()">Entrar</button>
        </div>
        <div *ngIf="loginError" style="color: #b00; margin-top: 10px;">Usuário ou senha inválidos</div>
      </div>
    </div>
  `,
  styles: [`
    .login-modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.3); z-index: 1001;
    }
    .login-modal {
      position: fixed; top: 0; right: 0; width: 100vw; max-width: 400px; height: 100vh;
      background: #fff; z-index: 1002; box-shadow: -2px 0 16px rgba(0,0,0,0.12);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 32px 24px;
    }
    .login-modal h2 { margin-bottom: 24px; }
    .login-modal input { width: 100%; margin-bottom: 16px; padding: 8px; }
    .login-actions { display: flex; gap: 12px; justify-content: center; }
    .login-actions button { padding: 8px 16px; }
  `]
})
export class LoginModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() loginResult = new EventEmitter<'admin' | 'user'>();

  username = '';
  password = '';
  loginError = false;

  close() {
    this.closeModal.emit();
  }

  login() {
    // Exemplo simples: admin/admin = admin, qualquer outro = user
    if (this.username === 'admin' && this.password === 'admin') {
      this.loginResult.emit('admin');
      this.loginError = false;
    } else if (this.username && this.password) {
      this.loginResult.emit('user');
      this.loginError = false;
    } else {
      this.loginError = true;
    }
  }
}
