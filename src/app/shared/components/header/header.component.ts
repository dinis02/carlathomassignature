import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { AdminService } from '../../../core/services/admin.service';
import { AdminModalComponent } from '../admin-modal.component';
import { LoginModalComponent } from '../login-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, AdminModalComponent, LoginModalComponent],
  styleUrls: ['./header.component.scss'],
  template: `
    <div class="announcement">
      Entrega grátis a partir de <span>19€</span> &nbsp;·&nbsp;
      Nova coleção primavera &nbsp;·&nbsp;
      <span>★ Makeup Rewards</span>
    </div>

    <header>
      <div class="header-inner">
        <nav class="nav-left">
          <a routerLink="/produtos" [queryParams]="{cat:'Maquilhagem'}" class="nav-link" routerLinkActive="active">Maquilhagem</a>
          <a routerLink="/produtos" [queryParams]="{cat:'Cabelo'}" class="nav-link">Cabelo</a>
          <a routerLink="/produtos" [queryParams]="{cat:'Rosto'}" class="nav-link">Rosto</a>
        </nav>

        <a routerLink="/" class="logo">
          <img src="assets/logo-carla-thomas.png" alt="Carla Thomas Logo" class="logo-img" />
        </a>

        <div class="nav-right">
          <nav style="display:flex;gap:36px;">
            <a routerLink="/produtos" [queryParams]="{cat:'Corpo'}" class="nav-link">Corpo</a>
            <a routerLink="/produtos" [queryParams]="{cat:'Acessórios'}" class="nav-link">Acessórios</a>
            <a routerLink="/produtos" class="nav-link">Marcas</a>
          </nav>
          <div class="header-icons">
            <button class="icon-btn" title="Pesquisar" aria-label="Pesquisar">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button class="icon-btn" title="Conta" aria-label="Conta" (click)="openLoginModal()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
            <button class="icon-btn" title="Wishlist" aria-label="Wishlist">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <a routerLink="/carrinho" class="icon-btn cart-icon" title="Carrinho" aria-label="Carrinho">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              @if (cart.count() > 0) {
                <span class="cart-count">{{ cart.count() }}</span>
              }
            </a>
          </div>
        </div>
      </div>
    </header>
    <app-login-modal *ngIf="showLoginModal"
      (closeModal)="closeLoginModal()"
      (loginResult)="onLogin($event)"
    ></app-login-modal>
    <app-admin-modal *ngIf="shouldShowAdminModal"></app-admin-modal>
  `,
  styles: [`
    .announcement {
      background: var(--noir); color: var(--creme);
      text-align: center; padding: 10px 20px;
      font-size: 11px; letter-spacing: 2.5px;
      text-transform: uppercase; font-weight: 200;
    }
    .announcement span { color: var(--rose-gold); }

    header {
      position: sticky; top: 0; z-index: 100;
      background: rgba(247,244,240,0.92);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .header-inner {
      max-width: 1400px; margin: 0 auto;
      padding: 0 48px; height: 72px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
    }
    .nav-left, .nav-right {
      display: flex; gap: 36px; align-items: center;
    }
    .nav-right { justify-content: flex-end; }

    .logo {
      text-align: center; color: var(--noir); cursor: none;
    }
    .logo-main {
      font-family: 'Cormorant Garamond', serif;
      font-size: 26px; font-weight: 300;
      letter-spacing: 1px; font-style: italic;
      display: block; line-height: 1;
    }
    .logo-sub {
      font-size: 8px; letter-spacing: 6px;
      text-transform: uppercase; color: var(--rose-gold);
      font-weight: 200; display: block; margin-top: 3px;
    }

    .header-icons { display: flex; gap: 20px; align-items: center; }
    .icon-btn {
      background: none; border: none; cursor: none;
      color: var(--noir); width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.2s; position: relative;
      text-decoration: none;
    }
    .icon-btn:hover { color: var(--rose-gold); }
    .cart-count {
      position: absolute; top: 2px; right: 2px;
      width: 14px; height: 14px;
      background: var(--rose-gold); color: white;
      font-size: 8px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 400;
    }

  `]
})
export class HeaderComponent {

  cart = inject(CartService);
  router = inject(Router);
  adminService = inject(AdminService);
  showLoginModal = false;
  showAdminModal = false;

  openLoginModal() {
    this.showLoginModal = true;
  }
  closeLoginModal() {
    this.showLoginModal = false;
  }
  onLogin(type: 'admin' | 'user') {
    this.showLoginModal = false;
    if (type === 'admin') {
      this.showAdminModal = true;
      this.adminService.loginAsAdmin();
      this.router.navigate(['/admin']);
    } else {
      this.showAdminModal = false;
      this.router.navigate(['/encomendas']);
    }
  }
  get shouldShowAdminModal() {
    return this.showAdminModal && this.adminService.isAdmin();
  }
}

