import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { OrderService } from '../../core/services/order.service';

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

      <div class="confirm-eyebrow">{{ paymentStatusText }}</div>

      <h1 class="confirm-title">
        Obrigada pela<br>sua <em>confianca</em>
      </h1>

      <p class="confirm-body">{{ confirmationMessage }}</p>

      <div class="rewards-earn">
        <span class="rewards-earn-icon">*</span>
        <div class="rewards-earn-text">
          <strong>+{{ rewardPoints }} pontos Makeup Rewards ganhos!</strong>
          <span>Os pontos ficam disponiveis depois da confirmacao final da encomenda.</span>
        </div>
      </div>

      <div class="confirm-order-box">
        <div class="confirm-row">
          <span class="lbl">Numero de encomenda</span>
          <span>{{ orderNumber }}</span>
        </div>
        <div class="confirm-row">
          <span class="lbl">Total pago</span>
          <span class="price">{{ total }} EUR</span>
        </div>
        <div class="confirm-row">
          <span class="lbl">Envio</span>
          <span>CTT Expresso · 2-4 dias uteis</span>
        </div>
        <div class="confirm-row">
          <span class="lbl">Estado Stripe</span>
          <span>{{ stripeStatusText }}</span>
        </div>
      </div>

      <div class="confirm-ctas">
        <a routerLink="/produtos" class="btn-primary" style="width:100%;display:flex;">
          <span>Continuar a comprar</span>
        </a>
        <a routerLink="/" class="btn-secondary">
          Voltar a pagina inicial
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
    .confirm-eyebrow {
      font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
      color: var(--rose-gold); margin-bottom: 16px; font-weight: 300;
    }
    .confirm-title {
      font-family: 'Cormorant Garamond', serif; font-size: clamp(40px,4vw,60px);
      font-weight: 300; margin-bottom: 20px; line-height: 1.1;
    }
    .confirm-title em { font-style: italic; color: var(--rose-gold); }
    .confirm-body {
      font-size: 14px; line-height: 1.8; color: var(--text-muted);
      max-width: 480px; margin: 0 auto 40px; font-weight: 200;
    }
    .rewards-earn {
      background: linear-gradient(135deg,var(--noir),#2A2420); color: var(--creme);
      padding: 24px 32px; margin-bottom: 40px; display: flex; align-items: center;
      gap: 20px; text-align: left;
    }
    .rewards-earn-icon { font-size: 28px; flex-shrink: 0; color: var(--rose-gold); }
    .rewards-earn-text strong {
      display: block; font-size: 15px; font-weight: 300; margin-bottom: 4px; color: var(--rose-gold);
    }
    .rewards-earn-text span { font-size: 12px; font-weight: 200; color: rgba(247,244,240,0.6); }
    .confirm-order-box { background: var(--creme-dark); padding: 32px; text-align: left; margin-bottom: 40px; }
    .confirm-row {
      display: flex; justify-content: space-between; padding: 10px 0;
      border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 300;
    }
    .confirm-row:last-child { border-bottom: none; }
    .confirm-row .lbl { color: var(--text-muted); }
    .confirm-row .price { color: var(--rose-gold); }
    .confirm-ctas { display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto; }
    @keyframes popIn { from{transform:scale(0);opacity:0} 60%{transform:scale(1.1)} to{transform:scale(1);opacity:1} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  `]
})
export class ConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  orderNumber = '';
  total = '0,00';
  rewardPoints = 0;
  paymentStatusText = 'Encomenda recebida';
  stripeStatusText = 'a confirmar';
  confirmationMessage = 'Recebemos a sua encomenda. Estamos a confirmar o estado do pagamento com a Stripe.';

  async ngOnInit(): Promise<void> {
    const order = this.route.snapshot.queryParamMap.get('order');
    const total = Number(this.route.snapshot.queryParamMap.get('total') || 0);
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    this.orderNumber = order || 'CTS-2025-0' + Math.floor(Math.random() * 9000 + 1000);
    this.setTotal(total);

    if (!sessionId) {
      this.paymentStatusText = 'Encomenda confirmada';
      this.confirmationMessage = 'A sua encomenda foi recebida com sucesso.';
      this.stripeStatusText = 'sem sessao Stripe';
      return;
    }

    try {
      const session = await firstValueFrom(this.orderService.getStripeSessionStatus(sessionId));
      if (session.orderId) this.orderNumber = session.orderId;
      this.setTotal(session.total || total);
      this.stripeStatusText = session.paymentStatus;

      if (session.paymentStatus === 'paid') {
        this.paymentStatusText = 'Pagamento confirmado';
        this.confirmationMessage = 'O pagamento foi confirmado pela Stripe. A sua encomenda ficou registada e sera preparada para envio.';
      } else {
        this.paymentStatusText = 'Pagamento em validacao';
        this.confirmationMessage = 'A Stripe ainda esta a validar o pagamento. Se o valor tiver sido cobrado, a encomenda sera atualizada automaticamente.';
      }
    } catch {
      this.paymentStatusText = 'Encomenda recebida';
      this.confirmationMessage = 'Recebemos o regresso da Stripe, mas nao foi possivel confirmar o pagamento neste momento.';
      this.stripeStatusText = 'erro de confirmacao';
    }
  }

  private setTotal(value: number): void {
    this.total = value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    this.rewardPoints = Math.floor(value);
  }
}
