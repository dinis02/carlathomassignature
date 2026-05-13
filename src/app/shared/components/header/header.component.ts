import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AdminService } from '../../../core/services/admin.service';
import { AccountSession, AuthService } from '../../../core/services/auth.service';
import { LoginModalComponent } from '../login-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule, LoginModalComponent],
  styleUrls: ['./header.component.scss'],
  template: `
    <div class="announcement" [class.hidden]="scrolledPastTop">
      Entrega grátis a partir de <span>19€</span> &nbsp;·&nbsp;
      Nova coleção primavera &nbsp;·&nbsp;
      <span>★ Makeup Rewards</span>
    </div>

    <header [class.compact]="scrolledPastTop">
      <div class="header-inner">
        <button class="mobile-menu-btn" title="Menu" aria-label="Menu" (click)="toggleMobileMenu()">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <nav class="nav-left mega-nav" (click)="closeMegaMenu()">
          <div class="nav-item" (pointerenter)="setMegaMenu('maquilhagem')" (mouseover)="setMegaMenu('maquilhagem')" (mouseleave)="clearMegaMenu()" [class.mega-open]="activeMegaMenu === 'maquilhagem'">
            <a routerLink="/produtos" [queryParams]="{cat:'Maquilhagem'}" class="nav-link" routerLinkActive="active">Maquilhagem</a>
            <div class="mega-menu">
              <div class="mega-inner">
                <div class="mega-feature">
                  <span>Nova colecao</span>
                  <strong>Maquilhagem de assinatura</strong>
                  <p>Batom, bases, blush e essenciais para acabamento luminoso.</p>
                </div>
                <div class="mega-col">
                  <h4>Catégoria</h4>
                  <a routerLink="/produtos" [queryParams]="{cat:'Maquilhagem'}">Ver maquilhagem</a>
                  <a routerLink="/produtos" [queryParams]="{cat:'Lábios'}">Lábios</a>
                  <a routerLink="/produtos" [queryParams]="{cat:'Rosto'}">Rosto</a>
                  <a routerLink="/produtos" [queryParams]="{cat:'Olhos'}">Olhos</a>
                </div>
                <div class="mega-col">
                  <h4>Edicao</h4>
                  <a routerLink="/produtos" [queryParams]="{q:'Debi'}">Debi</a>
                  <a routerLink="/produtos" [queryParams]="{q:'batom'}">Batons</a>
                  <a routerLink="/produtos" [queryParams]="{q:'novo'}">Novidades</a>
                </div>
              </div>
            </div>
          </div>
          <div class="nav-item" (pointerenter)="setMegaMenu('cabelo')" (mouseover)="setMegaMenu('cabelo')" (mouseleave)="clearMegaMenu()" [class.mega-open]="activeMegaMenu === 'cabelo'">
            <a routerLink="/produtos" [queryParams]="{cat:'Cabelo'}" class="nav-link">Cabelo</a>
            <div class="mega-menu">
              <div class="mega-inner">
                <div class="mega-feature">
                  <span>Ritual capilar</span>
                  <strong>Cuidado suave e sofisticado</strong>
                  <p>Produtos e acessorios para cabelo com acabamento elegante.</p>
                </div>
                <div class="mega-col">
                  <h4>Cabelo</h4>
                  <a routerLink="/produtos" [queryParams]="{cat:'Cabelo'}">Ver tudo</a>
                  <a routerLink="/produtos" [queryParams]="{q:'escova'}">Escovas</a>
                  <a routerLink="/produtos" [queryParams]="{q:'serum'}">Seruns</a>
                </div>
                <div class="mega-col">
                  <h4>Rotina</h4>
                  <a routerLink="/produtos" [queryParams]="{q:'brilho'}">Brilho</a>
                  <a routerLink="/produtos" [queryParams]="{q:'hidratacao'}">Hidratacao</a>
                  <a routerLink="/produtos" [queryParams]="{q:'penteado'}">Finalizacao</a>
                </div>
              </div>
            </div>
          </div>
          <div class="nav-item" (pointerenter)="setMegaMenu('rosto')" (mouseover)="setMegaMenu('rosto')" (mouseleave)="clearMegaMenu()" [class.mega-open]="activeMegaMenu === 'rosto'">
            <a routerLink="/produtos" [queryParams]="{cat:'Rosto'}" class="nav-link">Rosto</a>
            <div class="mega-menu">
              <div class="mega-inner">
                <div class="mega-feature">
                  <span>Skincare</span>
                  <strong>Pele luminosa todos os dias</strong>
                  <p>Curadoria para limpeza, hidratacao e acabamento natural.</p>
                </div>
                <div class="mega-col">
                  <h4>Rosto</h4>
                  <a routerLink="/produtos" [queryParams]="{cat:'Rosto'}">Ver tudo</a>
                  <a routerLink="/produtos" [queryParams]="{q:'creme'}">Cremes</a>
                  <a routerLink="/produtos" [queryParams]="{q:'serum'}">Seruns</a>
                </div>
                <div class="mega-col">
                  <h4>Necessidade</h4>
                  <a routerLink="/produtos" [queryParams]="{q:'luminosidade'}">Luminosidade</a>
                  <a routerLink="/produtos" [queryParams]="{q:'hidratacao'}">Hidratacao</a>
                  <a routerLink="/produtos" [queryParams]="{q:'anti idade'}">Anti-idade</a>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <a routerLink="/" class="logo">
          <img src="assets/logo-carla-thomas.png" alt="Carla Thomas Logo" class="logo-img" />
        </a>

        <div class="nav-right">
          <nav class="mega-nav nav-right-links" (click)="closeMegaMenu()">
            <div class="nav-item" (pointerenter)="setMegaMenu('corpo')" (mouseover)="setMegaMenu('corpo')" (mouseleave)="clearMegaMenu()" [class.mega-open]="activeMegaMenu === 'corpo'">
              <a routerLink="/produtos" [queryParams]="{cat:'Corpo'}" class="nav-link">Corpo</a>
              <div class="mega-menu">
                <div class="mega-inner">
                  <div class="mega-feature">
                    <span>Corpo</span>
                    <strong>Texturas ricas para um ritual completo</strong>
                    <p>Hidratantes, cremes e cuidados corporais com acabamento premium.</p>
                  </div>
                  <div class="mega-col">
                    <h4>Comprar</h4>
                    <a routerLink="/produtos" [queryParams]="{cat:'Corpo'}">Ver corpo</a>
                    <a routerLink="/produtos" [queryParams]="{q:'body createm'}">Body createm</a>
                    <a routerLink="/produtos" [queryParams]="{q:'hidratante'}">Hidratantes</a>
                  </div>
                  <div class="mega-col">
                    <h4>Destáques</h4>
                    <a routerLink="/produtos" [queryParams]="{q:'novo'}">Novidades</a>
                    <a routerLink="/produtos" [queryParams]="{q:'premium'}">Premium</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="nav-item" (pointerenter)="setMegaMenu('acessorios')" (mouseover)="setMegaMenu('acessorios')" (mouseleave)="clearMegaMenu()" [class.mega-open]="activeMegaMenu === 'acessorios'">
              <a routerLink="/produtos" [queryParams]="{cat:'Acessórios'}" class="nav-link">Acessórios</a>
              <div class="mega-menu">
                <div class="mega-inner">
                  <div class="mega-feature">
                    <span>Acessórios</span>
                    <strong>Ferramentas bonitas para a rotina</strong>
                    <p>Espelhos, pinc?is e detalhes que completam a experiencia de beleza.</p>
                  </div>
                  <div class="mega-col">
                    <h4>Comprar</h4>
                    <a routerLink="/produtos" [queryParams]="{cat:'Acessórios'}">Ver acessorios</a>
                    <a routerLink="/produtos" [queryParams]="{q:'pincel'}">Pinceis</a>
                    <a routerLink="/produtos" [queryParams]="{q:'espelho'}">Espelhos</a>
                  </div>
                  <div class="mega-col">
                    <h4>Essenciais</h4>
                    <a routerLink="/produtos" [queryParams]="{q:'organizador'}">Organizadores</a>
                    <a routerLink="/produtos" [queryParams]="{q:'kit'}">Kits</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="nav-item" (pointerenter)="setMegaMenu('marcas')" (mouseover)="setMegaMenu('marcas')" (mouseleave)="clearMegaMenu()" [class.mega-open]="activeMegaMenu === 'marcas'">
              <a routerLink="/produtos" class="nav-link">Marcas</a>
              <div class="mega-menu">
                <div class="mega-inner">
                  <div class="mega-feature">
                    <span>Marcas</span>
                    <strong>Curadoria de nomes selecionados</strong>
                    <p>Explore Debi, Dior, Chanel, Boca Rosa e outras escolhas da loja.</p>
                  </div>
                  <div class="mega-col">
                    <h4>Marcas</h4>
                    <a routerLink="/produtos" [queryParams]="{q:'Debi'}">Debi</a>
                    <a routerLink="/produtos" [queryParams]="{q:'Dior'}">Dior</a>
                    <a routerLink="/produtos" [queryParams]="{q:'Chanel'}">Chanel</a>
                    <a routerLink="/produtos" [queryParams]="{q:'Boca Rosa'}">Boca Rosa</a>
                  </div>
                  <div class="mega-col">
                    <h4>Comprar</h4>
                    <a routerLink="/produtos">Todas as marcas</a>
                    <a routerLink="/produtos" [queryParams]="{q:'novo'}">Novidades</a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <div class="header-icons">
            <div class="nav-item search-trigger" (pointerenter)="openSearchMenu()" (mouseover)="openSearchMenu()" (mouseleave)="closeSearchMenu()" [class.mega-open]="activeMegaMenu === 'search' || searchOpen">
              <button class="icon-btn" title="Pesquisar" aria-label="Pesquisar" (click)="toggleSearch($event)">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <form class="mega-menu search-mega" (submit)="submitSearch($event)">
                <div class="mega-inner search-inner">
                  <div class="search-field">
                    <label class="search-label" for="headerSearch">Pesquisar</label>
                    <input
                      id="headerSearch"
                      class="header-search-input"
                      name="headerSearch"
                      [(ngModel)]="searchTerm"
                      type="search"
                      autocomplete="off"
                      placeholder="Produto, marca ou catégoria"
                      (keydown.escape)="closeSearch()">
                  </div>
                  <div class="search-actions">
                    <button class="search-submit" type="submit">Pesquisar</button>
                  </div>
                </div>
              </form>
            </div>
            <button class="icon-btn" [title]="auth.session() ? 'A minha conta' : 'Conta'" aria-label="Conta" (click)="handleAccountClick()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
            @if (auth.session()) {
              <button class="icon-btn" title="Terminar sessão" aria-label="Terminar sessão" (click)="logout($event)">
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
    <div class="mobile-menu-backdrop" *ngIf="mobileMenuOpen" (click)="closeMobileMenu()"></div>
    <nav class="mobile-menu" [class.open]="mobileMenuOpen" aria-label="Menu mobile">
      <div class="mobile-menu-head">
        <div>
          <span class="mobile-menu-brand">Carla Thomas</span>
          <span class="mobile-menu-sub">Signature</span>
        </div>
        <button class="mobile-menu-close" type="button" aria-label="Fechar menu" (click)="closeMobileMenu()">×</button>
      </div>
      <a routerLink="/" (click)="closeMobileMenu()">Início</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Maquilhagem'}" (click)="closeMobileMenu()">Maquilhagem</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Cabelo'}" (click)="closeMobileMenu()">Cabelo</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Rosto'}" (click)="closeMobileMenu()">Rosto</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Corpo'}" (click)="closeMobileMenu()">Corpo</a>
      <a routerLink="/produtos" [queryParams]="{cat:'Acessórios'}" (click)="closeMobileMenu()">Acessórios</a>
      <a routerLink="/produtos" (click)="closeMobileMenu()">Marcas</a>
      @if (auth.session()) {
        <a routerLink="/encomendas" [queryParams]="{sec:'wishlist'}" (click)="closeMobileMenu()">Wishlist</a>
        <a href="#" (click)="logout($event)">Terminar sessão</a>
      } @else {
        <a href="#" (click)="openLoginFromMenu($event)">Entrar / Criar conta</a>
      }
    </nav>
    <app-login-modal *ngIf="showLoginModal"
      (closeModal)="closeLoginModal()"
      (loginResult)="onLogin($event)"
    ></app-login-modal>
  `,
  styles: [`
    :host {
      display: block;
      height: 107px;
    }

    .announcement {
      background: var(--noir); color: var(--creme);
      text-align: center; padding: 10px 20px;
      font-size: 11px; letter-spacing: 2.5px;
      text-transform: uppercase; font-weight: 200;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 130;
      transform: translateY(0);
      transition: transform 220ms ease, opacity 220ms ease;
    }
    .announcement.hidden {
      opacity: 0;
      transform: translateY(-100%);
      pointer-events: none;
    }
    .announcement span { color: var(--rose-gold); }

    header {
      position: fixed; top: 35px; left: 0; right: 0; z-index: 129;
      background: rgba(247,244,240,0.92);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      transition: top 220ms ease, box-shadow 220ms ease;
    }
    header.compact {
      top: 0;
      box-shadow: 0 8px 30px rgba(20, 16, 13, 0.08);
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
    .mega-nav {
      display: flex;
      align-items: center;
      gap: 36px;
    }
    .nav-right-links {
      gap: 36px;
    }
    .nav-item {
      position: static;
      height: 72px;
      display: flex;
      align-items: center;
    }
    .nav-item > .nav-link {
      height: 72px;
      display: flex;
      align-items: center;
    }
    .mega-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 120;
      background: rgba(247, 244, 240, 0.98);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 24px 60px rgba(20, 16, 13, 0.12);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      pointer-events: none;
      transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
    }
    .nav-item.mega-open .mega-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }
    .mega-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 28px 48px 32px;
      display: grid;
      grid-template-columns: minmax(280px, 1.2fr) minmax(180px, 0.7fr) minmax(180px, 0.7fr);
      gap: 54px;
    }
    .mega-feature span,
    .mega-col h4 {
      display: block;
      margin: 0 0 14px;
      color: var(--rose-gold);
      font-size: 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 300;
    }
    .mega-feature strong {
      display: block;
      color: var(--noir);
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(30px, 3vw, 44px);
      line-height: 0.95;
      font-weight: 300;
      max-width: 420px;
    }
    .mega-feature p {
      margin: 16px 0 0;
      max-width: 430px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.9;
      font-weight: 300;
    }
    .mega-col {
      display: flex;
      flex-direction: column;
      gap: 11px;
      padding-top: 5px;
    }
    .mega-col a {
      color: var(--noir);
      font-size: 13px;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      text-decorateion: none;
      font-weight: 300;
      transition: color 160ms ease, transform 160ms ease;
    }
    .mega-col a:hover {
      color: var(--rose-gold);
      transform: translateX(4px);
    }

    .logo {
      text-align: center; color: var(--noir); cursor: none;
    }
    .logo-img {
      display: block;
      width: 132px;
      height: auto;
      transform: scale(0.84);
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
      text-decorateion: none;
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

    .search-trigger {
      height: 72px;
    }

    .search-mega {
      cursor: default;
    }

    .search-inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      padding-top: 18px;
      padding-bottom: 18px;
    }

    .search-field {
      display: grid;
      gap: 12px;
    }

    .search-actions {
      display: flex;
      gap: 10px;
      align-self: end;
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
      background: rgba(255,255,255,0.42);
      color: var(--noir);
      height: 52px;
      padding: 0 18px;
      font-family: inherit;
      font-size: 16px;
      outline: none;
    }

    .header-search-input:focus {
      border-color: var(--rose-gold);
    }

    .search-submit {
      border: 1px solid var(--noir);
      height: 52px;
      min-width: 160px;
      padding: 0 28px;
      background: var(--noir);
      color: var(--creme);
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      cursor: none;
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
      text-decorateion: none;
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
        width: 118px;
      }
    }

    @media (max-width: 640px) {
      :host {
        height: 108px;
      }

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

      header {
        top: 44px;
      }

      header.compact {
        top: 0;
      }

      .logo-img {
        width: 100px;
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

      .search-trigger {
        position: static;
        height: 64px;
      }

      .search-inner {
        padding: 18px 14px;
        grid-template-columns: 1fr;
        gap: 14px;
      }

      .search-label {
        display: none;
      }

      .search-submit {
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
  mobileMenuOpen = false;
  searchOpen = false;
  searchTerm = '';
  activeMegaMenu = '';
  scrolledPastTop = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.scrolledPastTop = window.scrollY > 24;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
  setMegaMenu(menu: string) {
    this.activeMegaMenu = menu;
  }
  clearMegaMenu() {
    if (!this.searchOpen) {
      this.activeMegaMenu = '';
    }
  }
  closeMegaMenu() {
    this.activeMegaMenu = '';
    this.searchOpen = false;
  }
  openSearchMenu() {
    this.activeMegaMenu = 'search';
  }
  closeSearchMenu() {
    if (!this.searchOpen) {
      this.activeMegaMenu = '';
    }
  }
  toggleSearch(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.searchOpen = !this.searchOpen;
    if (this.searchOpen) {
      this.activeMegaMenu = 'search';
      this.closeMobileMenu();
      setTimeout(() => document.querySelector<HTMLInputElement>('.header-search-input')?.focus(), 0);
    } else {
      this.activeMegaMenu = '';
    }
  }
  closeSearch() {
    this.searchOpen = false;
    this.activeMegaMenu = '';
    this.searchTerm = '';
  }
  submitSearch(event?: Event) {
    event?.preventDefault();
    const q = this.searchTerm.trim();
    if (!q) return;
    this.searchOpen = false;
    this.activeMegaMenu = '';
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
    this.closeMobileMenu();
    await this.router.navigate(['/']);
  }
  closeLoginModal() {
    this.showLoginModal = false;
  }
  onLogin(session: AccountSession) {
    this.showLoginModal = false;
    if (session.role === 'admin') {
      void this.router.navigate(['/admin']);
    } else {
      void this.router.navigate(['/encomendas']);
    }
  }
}


