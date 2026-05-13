import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <div class="cart-view">
      <div class="checkout-header">
        <a routerLink="/produtos" class="btn-ghost back">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
          Continuar a comprar
        </a>
        <div class="section-label" style="margin-top:20px;">Passo 1 de 3</div>
        <h1 class="checkout-title">O seu <em>carrinho</em></h1>
        <p class="checkout-subtitle">Reveja os seus artigos antes de prosseguir</p>
      </div>

      <!-- Steps -->
      <div class="checkout-steps">
        <div class="step active"><div class="step-num">1</div><div class="step-label">Carrinho</div></div>
        <div class="step-line"></div>
        <div class="step pending"><div class="step-num">2</div><div class="step-label">Entrega & Pagamento</div></div>
        <div class="step-line"></div>
        <div class="step pending"><div class="step-num">3</div><div class="step-label">Confirma??o</div></div>
      </div>

      @if (cart.items().length === 0) {
        <div class="empty-cart">
          <svg width="64" height="64" fill="none" stroke="var(--text-muted)" stroke-width="1" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <h2>O seu carrinho est? vazio</h2>
          <p>Descubra a nossa colec??o e adicione produtos ao carrinho.</p>
          <a routerLink="/produtos" class="btn-primary" style="width:auto;padding:14px 40px;">
            <span>Ver produtos</span>
          </a>
        </div>
      } @else {
        <div class="cart-layout">
          <!-- Items -->
          <div class="cart-items">
            @for (item of cart.items(); track item.product.id) {
              <div class="cart-item">
                <a [routerLink]="['/produto', item.product.id]" class="cart-item-img">
                  <div class="cart-img-bg"
                       [style.background]="'linear-gradient(145deg,' + item.product.gradientFrom + ',' + item.product.gradientTo + ')'">
                  </div>
                </a>
                <div class="cart-item-details">
                  <div class="cart-item-brand">{{ item.product.brand }}</div>
                  <div class="cart-item-name">{{ item.product.name }}</div>
                  <div class="cart-item-meta">
                    @if (item.selectedShade) { <span>Tom: {{ item.selectedShade }}</span> }
                    @if (item.selectedFinish) { <span>Acabamento: {{ item.selectedFinish }}</span> }
                  </div>
                  <div class="cart-item-qty">
                    <button (click)="cart.updateeQty($index, item.quantity - 1)">?</button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="cart.updateeQty($index, item.quantity + 1)">+</button>
                  </div>
                  <button class="cart-remove" (click)="cart.remove($index)">Remover</button>
                </div>
                <div class="cart-item-price">
                  <div class="price-main">{{ (item.product.price * item.quantity) | number:'1.2-2' }} ?</div>
                  @if (item.product.originalPrice) {
                    <div class="price-original">{{ (item.product.originalPrice * item.quantity) | number:'1.2-2' }} ?</div>
                  }
                </div>
              </div>
            }

            <!-- Coupon -->
            <div class="coupon-row">
              <input [(ngModel)]="couponCode" placeholder="C?digo de desconto ou Makeup Rewards"
                     class="coupon-input" [class.invalid]="couponInvalid()">
              <button class="coupon-btn" (click)="applyCoupon()">Aplicar</button>
            </div>
            @if (cart.appliedCoupon()) {
              <p class="coupon-ok">? C?digo {{ cart.appliedCoupon() }} aplicado ? -{{ cart.discount() | number:'1.2-2' }} ?</p>
            }
            @if (couponInvalid()) {
              <p class="coupon-err">C?digo inv?lido. Tente CARLA10 ou REWARDS.</p>
            }
          </div>

          <!-- Summary -->
          <div class="order-summary">
            <div class="summary-title">Resumo da encomenda</div>
            <div class="summary-lines">
              <div class="summary-line">
                <span class="lbl">Subtotal ({{ cart.count() }} artigos)</span>
                <span class="val">{{ cart.subtotal() | number:'1.2-2' }} ?</span>
              </div>
              @if (cart.discount() > 0) {
                <div class="summary-line discount">
                  <span class="lbl">Desconto</span>
                  <span class="val">?{{ cart.discount() | number:'1.2-2' }} ?</span>
                </div>
              }
              <div class="summary-line free">
                <span class="lbl">Envio</span>
                <span class="val">Gratuito</span>
              </div>
            </div>
            <div class="summary-total">
              <span class="lbl">Total</span>
              <span class="val">{{ cart.total() | number:'1.2-2' }} ?</span>
            </div>
            <button class="btn-primary" (click)="proceed()">
              <span>Prosseguir para checkout</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>
            <p class="summary-note">Pagamento seguro ? SSL 256-bit</p>
            <div class="pay-icons">
              <span class="pay-icon">Visa</span>
              <span class="pay-icon">MC</span>
              <span class="pay-icon">MB Way</span>
              <span class="pay-icon">PayPal</span>
            </div>
            <div class="rewards-banner">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <div class="rewards-banner-text">
                <strong>+{{ cart.rewardPoints() }} pontos Makeup Rewards</strong>
                equivale a {{ (cart.rewardPoints() / 100) | number:'1.2-2' }} ? de desconto futuro
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  cart       = inject(CartService);
  private router = inject(Router);

  couponCode   = '';
  couponInvalid = signal(false);

  applyCoupon(): void {
    if (!this.couponCode) return;
    const ok = this.cart.applyCoupon(this.couponCode);
    this.couponInvalid.set(!ok);
    if (ok) this.couponCode = '';
  }

  proceed(): void { this.router.navigate(['/checkout']); }
}

