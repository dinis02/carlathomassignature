import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AdminService } from '../../../core/services/admin.service';
import { AccountSession, AuthService } from '../../../core/services/auth.service';
import { AdminModalComponent } from '../admin-modal.component';
import { LoginModalComponent } from '../login-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule, AdminModalComponent, LoginModalComponent],
  styleUrls: ['./header.component.scss'],
  template: `
    <div class="announcement">
      Entrega grátis a partir de <span>19€</span> &nbsp;·&nbsp;
      Nova coleção primavera &nbsp;·&nbsp;
      <span>★ Makeup Rewards</span>
    </div>

    <header>
      <div class="header-inner">
        <button class="mobile-menu-btn" title="Menu" aria-label="Menu" (click)="toggleMobileMenu()">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
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
            <button class="icon-btn" title="Pesquisar" aria-label="Pesquisar" (click)="toggleSearch()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button class="icon-btn" [title]="auth.session() ? 'A minha conta' : 'Conta'" aria-label="Conta" (click)="handleAccountClick()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
            @if (auth.session()) {
              <button class="icon-btn" title="Terminar sessao" aria-label="Terminar sessao" (click)="logout($event)">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <path d="M16 17l5-5-5-5"/>
                  <path d="M21 12H9"/>
                </svg>
              </button>
            }
            @if (auth.session()) {
              <button class="icon-btn wishlist-header-btn" title="Wishlist" aria-label="Wishlist" (click)="goToWishlist()">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            }
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
    @if (searchOpen) {
      <div class="search-backdrop" (click)="closeSearch()"></div>
      <form class="header-search-panel" (submit)="submitSearch($event)">
        <label class="search-label" for="headerSearch">Pesquisar</label>
        <input
          id="headerSearch"
          class="header-search-input"
          name="headerSearch"
          [(ngModel)]="searchTerm"
          type="search"
          autocomplete="off"
          placeholder="Produto, marca ou categoria"
          (keydown.escape)="closeSearch()">
        <button class="search-submit" type="submit">Pesquisar</button>
        <button class="search-close" type="button" aria-label="Fechar pesquisa" (click)="closeSearch()">Fechar</button>
      </form>
    }
    <div class="mobile-menu-backdrop" *ngIf="mobileMenuOpen" (click)="closeMobileMenu()"></div>
    <nav class="mobile-menu" [class.open]="mobileMenuOpen" aria-label="Menu mobile">
      <div class="mobile-menu-head">
        <div>
          <span class="mobile-menu-brand">Carla Thomas</span>
          <span class="mobile-menu-sub">Signature</span>
        </div>
        <button class="mobile-menu-close" type="button" aria-label="Fechar menu" (click)="closeMobileMenu()">×</button>
      </div>
      <a routerLink="/" (click)="closeMobileMenu()">Inicio</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Maquilhagem'}" (click)="closeMobileMenu()">Maquilhagem</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Cabelo'}" (click)="closeMobileMenu()">Cabelo</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Rosto'}" (click)="closeMobileMenu()">Rosto</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Corpo'}" (click)="closeMobileMenu()">Corpo</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Acessórios'}" (click)="closeMobileMenu()">Acessorios</a>
      <a routerLink="/produtos" (click)="closeMobileMenu()">Marcas</a>
      @if (auth.session()) {
        <a routerLink="/encomendas" [queryParams]="{sec:'wishlist'}" (click)="closeMobileMenu()">Wishlist</a>
        <a href="#" (click)="logout($event)">Terminar sessao</a>
      } @else {
        <a href="#" (click)="openLoginFromMenu($event)">Entrar / Criar conta</a>
      }
    </nav>
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
    .logo-img {
      display: block;
      transform: scale(0.93);
      transform-origin: center;
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
    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      color: var(--noir);
      width: 36px;
      height: 36px;
      align-items: center;
      justify-content: center;
      cursor: none;
    }
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

    .search-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(26,23,20,0.22);
      z-index: 98;
    }

    .header-search-panel {
      position: fixed;
      top: 72px;
      left: 0;
      right: 0;
      z-index: 101;
      background: rgba(247,244,240,0.98);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 18px 48px rgba(26,23,20,0.10);
      padding: 18px 48px;
      display: grid;
      grid-template-columns: auto minmax(180px, 1fr) auto auto;
      align-items: center;
      gap: 16px;
    }

    .search-label {
      color: var(--text-muted);
      font-size: 10px;
      letter-spacing: 2.8px;
      text-transform: uppercase;
    }

    .header-search-input {
      width: 100%;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--noir);
      height: 46px;
      padding: 0 16px;
      font-family: inherit;
      font-size: 15px;
      outline: none;
    }

    .header-search-input:focus {
      border-color: var(--rose-gold);
    }

    .search-submit,
    .search-close {
      border: 1px solid var(--noir);
      height: 46px;
      padding: 0 22px;
      background: var(--noir);
      color: var(--creme);
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      cursor: none;
    }

    .search-close {
      background: transparent;
      color: var(--noir);
      border-color: var(--border);
    }

    .mobile-menu-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(26,23,20,0.36);
      z-index: 998;
    }

    .mobile-menu {
      position: fixed;
      top: 0;
      left: 0;
      width: min(86vw, 340px);
      height: 100vh;
      background: var(--creme);
      border-right: 1px solid var(--border);
      z-index: 999;
      transform: translateX(-100%);
      transition: transform 0.28s ease;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-shadow: 18px 0 60px rgba(26,23,20,0.16);
    }

    .mobile-menu.open {
      transform: translateX(0);
    }

    .mobile-menu-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
      padding-bottom: 22px;
      border-bottom: 1px solid var(--border);
    }

    .mobile-menu-brand {
      display: block;
      font-family: 'Cormorant Garamond', serif;
      font-size: 26px;
      font-style: italic;
      font-weight: 300;
      line-height: 1;
    }

    .mobile-menu-sub {
      display: block;
      margin-top: 5px;
      color: var(--rose-gold);
      font-size: 8px;
      letter-spacing: 5px;
      text-transform: uppercase;
    }

    .mobile-menu-close {
      border: 1px solid var(--border);
      background: transparent;
      width: 34px;
      height: 34px;
      color: var(--noir);
      font-family: 'Cormorant Garamond', serif;
      font-size: 24px;
      line-height: 1;
      cursor: none;
    }

    .mobile-menu a {
      padding: 16px 0;
      border-bottom: 1px solid var(--border);
      color: var(--noir);
      text-decoration: none;
      font-size: 11px;
      letter-spacing: 2.4px;
      text-transform: uppercase;
      font-weight: 300;
    }

    @media (max-width: 1024px) {
      .header-inner {
        padding: 0 24px;
        grid-template-columns: auto 1fr auto;
        gap: 16px;
      }

      .nav-left,
      .nav-right nav {
        display: none !important;
      }

      .mobile-menu-btn {
        display: inline-flex;
      }

      .nav-right {
        justify-content: flex-end;
      }

      .logo-img {
        width: 132px;
      }
    }

    @media (max-width: 640px) {
      .announcement {
        padding: 8px 14px;
        font-size: 9px;
        letter-spacing: 1.5px;
        line-height: 1.5;
      }

      .header-inner {
        height: 64px;
        padding: 0 14px;
        display: flex;
        justify-content: space-between;
      }

      .logo-img {
        width: 112px;
      }

      .header-icons {
        gap: 8px;
      }

      .icon-btn {
        width: 32px;
        height: 32px;
      }

      .wishlist-header-btn {
        display: none;
      }

      .header-search-panel {
        top: 64px;
        padding: 16px 14px;
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .search-label {
        display: none;
      }

      .search-submit,
      .search-close {
        width: 100%;
      }
    }

  `]
})
export class HeaderComponent {

  cart = inject(CartService);
  router = inject(Router);
  adminService = inject(AdminService);
  auth = inject(AuthService);
  showLoginModal = false;
  showAdminModal = false;
  mobileMenuOpen = false;
  searchOpen = false;
  searchTerm = '';

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    if (this.searchOpen) {
      this.closeMobileMenu();
      setTimeout(() => document.querySelector<HTMLInputElement>('.header-search-input')?.focus(), 0);
    }
  }
  closeSearch() {
    this.searchOpen = false;
    this.searchTerm = '';
  }
  submitSearch(event?: Event) {
    event?.preventDefault();
    const q = this.searchTerm.trim();
    if (!q) return;
    this.searchOpen = false;
    void this.router.navigate(['/produtos'], { queryParams: { q } });
  }
  openLoginModal() {
    this.closeMobileMenu();
    this.showLoginModal = true;
  }
  handleAccountClick() {
    const session = this.auth.session();
    if (!session) {
      this.openLoginModal();
      return;
    }
    this.router.navigate([session.role === 'admin' ? '/admin' : '/encomendas']);
  }
  goToWishlist() {
    this.router.navigate(['/encomendas'], { queryParams: { sec: 'wishlist' } });
  }
  openLoginFromMenu(event: Event) {
    event.preventDefault();
    this.openLoginModal();
  }
  async logout(event?: Event) {
    event?.preventDefault();
    await this.adminService.logoutAdmin();
    this.showAdminModal = false;
    this.closeMobileMenu();
    await this.router.navigate(['/']);
  }
  closeLoginModal() {
    this.showLoginModal = false;
  }
  onLogin(session: AccountSession) {
    this.showLoginModal = false;
    if (session.role === 'admin') {
      this.showAdminModal = true;
      this.adminService.loginAsAdmin();
      void this.router.navigate(['/admin']).finally(() => {
        this.showAdminModal = false;
      });
    } else {
      this.showAdminModal = false;
      void this.router.navigate(['/encomendas']);
    }
  }
  get shouldShowAdminModal() {
    return this.showAdminModal && this.auth.isAdmin();
  }
}

