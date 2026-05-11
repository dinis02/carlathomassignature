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
              <li><a routerLink="/produtos" [queryParams]="{ cat: 'Maquilhagem' }">Maquilhagem</a></li>
              <li><a routerLink="/produtos" [queryParams]="{ cat: 'Rosto' }">Skincare</a></li>
              <li><a routerLink="/produtos" [queryParams]="{ cat: 'Cabelo' }">Cabelo</a></li>
              <li><a routerLink="/produtos" [queryParams]="{ cat: 'Corpo' }">Corpo</a></li>
              <li><a routerLink="/produtos" [queryParams]="{ cat: 'Acessorios' }">Acessorios</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Ajuda</h4>
            <ul>
              <li><a routerLink="/termos-condicoes">Entregas</a></li>
              <li><a routerLink="/termos-condicoes">Devolucoes</a></li>
              <li><a routerLink="/termos-condicoes">FAQ</a></li>
              <li><a href="mailto:geral@carlathomassignature.pt">Contacto</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Sobre</h4>
            <ul>
              <li><a routerLink="/sobre">A nossa historia</a></li>
              <li><a routerLink="/encomendas">Makeup Rewards</a></li>
              <li><a routerLink="/sobre">Blog</a></li>
              <li><a routerLink="/politica-privacidade">Privacidade</a></li>
              <li><a routerLink="/politica-cookies">Cookies</a></li>
              <li><a routerLink="/termos-condicoes">Termos & Condicoes</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© 2026 Carla Thomas Signature. Todos os direitos reservados.</span>
          <div class="social-links">
            <a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a>
            <a href="https://www.tiktok.com/" target="_blank" rel="noopener">TikTok</a>
            <a href="https://www.pinterest.com/" target="_blank" rel="noopener">Pinterest</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    footer {
      background: var(--noir);
      color: var(--creme);
      padding: 80px 48px 40px;
    }

    .footer-inner {
      max-width: 1400px;
      margin: 0 auto;
    }

    .footer-top {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 64px;
      padding-bottom: 64px;
      border-bottom: 1px solid rgba(247,244,240,0.08);
    }

    .logo-main {
      font-family: 'Cormorant Garamond', serif;
      font-size: 26px;
      font-weight: 300;
      font-style: italic;
      display: block;
      color: var(--creme);
      margin-bottom: 4px;
    }

    .logo-sub {
      font-size: 8px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: var(--rose-gold);
      font-weight: 200;
      display: block;
      margin-bottom: 20px;
    }

    .footer-desc {
      font-size: 13px;
      line-height: 1.8;
      color: rgba(247,244,240,0.4);
      font-weight: 200;
      max-width: 260px;
    }

    .footer-col h4 {
      font-size: 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--rose-gold);
      margin-bottom: 24px;
      font-weight: 300;
    }

    .footer-col ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-col ul li {
      margin-bottom: 12px;
    }

    .footer-col ul li a,
    .social-links a {
      color: rgba(247,244,240,0.4);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-col ul li a {
      font-size: 13px;
      font-weight: 200;
    }

    .footer-col ul li a:hover,
    .social-links a:hover {
      color: var(--creme);
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding-top: 32px;
      font-size: 11px;
      color: rgba(247,244,240,0.25);
      font-weight: 200;
    }

    .social-links {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .social-links a {
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 200;
    }

    @media (max-width: 900px) {
      footer {
        padding: 56px 24px 34px;
      }

      .footer-top {
        grid-template-columns: 1fr 1fr;
        gap: 42px 28px;
      }
    }

    @media (max-width: 620px) {
      .footer-top {
        grid-template-columns: 1fr;
      }

      .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class FooterComponent {}
