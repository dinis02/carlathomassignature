import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer>
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="logo-main">Carla Thomas</span>
            <span class="logo-sub">Signature</span>
            <p class="footer-desc">Curadoria de beleza premium para quem valoriza autenticidade, qualidade e ritual.</p>
          </div>
          <div class="footer-col">
            <h4>Loja</h4>
            <ul>
              <li><a routerLink="/produtos">Maquilhagem</a></li>
              <li><a routerLink="/produtos">Skincare</a></li>
              <li><a routerLink="/produtos">Cabelo</a></li>
              <li><a routerLink="/produtos">Corpo</a></li>
              <li><a routerLink="/produtos">Acessórios</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Ajuda</h4>
            <ul>
              <li><a href="#">Entregas</a></li>
              <li><a href="#">Devoluções</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Contacto</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Sobre</h4>
            <ul>
              <li><a href="#">A nossa história</a></li>
              <li><a href="#">Makeup Rewards</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2025 Carla Thomas Signature. Todos os direitos reservados.</span>
          <div class="social-links">
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
            <a href="#">Pinterest</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    footer {
      background: var(--noir); color: var(--creme);
      padding: 80px 48px 40px;
    }
    .footer-inner { max-width: 1400px; margin: 0 auto; }
    .footer-top {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 64px; padding-bottom: 64px;
      border-bottom: 1px solid rgba(247,244,240,0.08);
    }
    .logo-main {
      font-family: 'Cormorant Garamond', serif;
      font-size: 26px; font-weight: 300; font-style: italic;
      display: block; color: var(--creme); margin-bottom: 4px;
    }
    .logo-sub {
      font-size: 8px; letter-spacing: 6px; text-transform: uppercase;
      color: var(--rose-gold); font-weight: 200; display: block; margin-bottom: 20px;
    }
    .footer-desc {
      font-size: 13px; line-height: 1.8;
      color: rgba(247,244,240,0.4); font-weight: 200; max-width: 260px;
    }
    .footer-col h4 {
      font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
      color: var(--rose-gold); margin-bottom: 24px; font-weight: 300;
    }
    .footer-col ul { list-style: none; }
    .footer-col ul li { margin-bottom: 12px; }
    .footer-col ul li a {
      color: rgba(247,244,240,0.4); text-decoration: none;
      font-size: 13px; font-weight: 200; transition: color 0.2s;
    }
    .footer-col ul li a:hover { color: var(--creme); }
    .footer-bottom {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 32px; font-size: 11px;
      color: rgba(247,244,240,0.25); font-weight: 200;
    }
    .social-links { display: flex; gap: 20px; }
    .social-links a {
      color: rgba(247,244,240,0.4); text-decoration: none;
      font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
      transition: color 0.2s; font-weight: 200;
    }
    .social-links a:hover { color: var(--rose-gold); }
  `]
})
export class FooterComponent {}
