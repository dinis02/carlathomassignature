import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="confirm-view">
      <div class="confirm-icon">
        <svg width="28" height="28" fill="none" stroke="var(--creme)" stroke-width="1.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <div class="confirm-eyebrow">Encomenda confirmada</div>

      <h1 class="confirm-title">
        Obrigada pela<br>sua <em>confiança</em>
      </h1>

      <p class="confirm-body">
        A sua encomenda foi recebida com sucesso. Receberá um email de confirmação
        com os detalhes e o número de tracking assim que for expedida.
      </p>

      <div class="rewards-earn">
        <span class="rewards-earn-icon">⭐</span>
        <div class="rewards-earn-text">
          <strong>+62 pontos Makeup Rewards ganhos!</strong>
          <span>Saldo total: 214 pontos · equivale a 2,14 € de desconto</span>
        </div>
      </div>

      <div class="confirm-order-box">
        <div class="confirm-row">
          <span class="lbl">Número de encomenda</span>
          <span>#CTS-{{ orderNumber }}</span>
        </div>
        <div class="confirm-row">
          <span class="lbl">Total pago</span>
          <span class="price">61,60 €</span>
        </div>
        <div class="confirm-row">
          <span class="lbl">Envio</span>
          <span>CTT Expresso · 2–4 dias úteis</span>
        </div>
        <div class="confirm-row">
          <span class="lbl">Email de confirmação</span>
          <span>enviado para a sua caixa</span>
        </div>
      </div>

      <div class="confirm-ctas">
        <a routerLink="/produtos" class="btn-primary" style="width:100%;display:flex;">
          <span>Continuar a comprar</span>
        </a>
        <a routerLink="/" class="btn-secondary">
          Voltar à página inicial
        </a>
      </div>
    </div>
  `,
  styles: [`
    .confirm-view {
      max-width: 640px; margin: 0 auto; padding: 80px 48px 120px; text-align: center;
      animation: fadeUp 0.6s ease both;
    }
    .confirm-icon {
      width: 64px; height: 64px; background: var(--noir); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 36px; animation: popIn 0.5s ease forwards;
    }
    .confirm-eyebrow { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: var(--rose-gold); margin-bottom: 16px; font-weight: 300; }
    .confirm-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(40px,4vw,60px); font-weight: 300; margin-bottom: 20px; line-height: 1.1; em { font-style: italic; color: var(--rose-gold); } }
    .confirm-body { font-size: 14px; line-height: 1.8; color: var(--text-muted); max-width: 480px; margin: 0 auto 40px; font-weight: 200; }
    .rewards-earn {
      background: linear-gradient(135deg,var(--noir),#2A2420); color: var(--creme);
      padding: 24px 32px; margin-bottom: 40px; display: flex; align-items: center; gap: 20px; text-align: left;
    }
    .rewards-earn-icon { font-size: 28px; flex-shrink: 0; }
    .rewards-earn-text strong { display: block; font-size: 15px; font-weight: 300; margin-bottom: 4px; color: var(--rose-gold); }
    .rewards-earn-text span { font-size: 12px; font-weight: 200; color: rgba(247,244,240,0.6); }
    .confirm-order-box { background: var(--creme-dark); padding: 32px; text-align: left; margin-bottom: 40px; }
    .confirm-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 300; &:last-child { border-bottom: none; } }
    .confirm-row .lbl { color: var(--text-muted); }
    .confirm-row .price { color: var(--rose-gold); }
    .confirm-ctas { display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto; }
    @keyframes popIn { from{transform:scale(0);opacity:0} 60%{transform:scale(1.1)} to{transform:scale(1);opacity:1} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  `]
})
export class ConfirmationComponent implements OnInit {
  orderNumber = '';

  ngOnInit(): void {
    this.orderNumber = '2025-0' + Math.floor(Math.random() * 9000 + 1000);
  }
}
