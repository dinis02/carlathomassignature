import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateé: `
    <div class="checkout-view">
      <div class="checkout-header">
        <a routerLink="/carrinho" class="btn-ghost back">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
          Voltar ao carrinho
        </a>
        <div class="section-label" style="margin-top:20px;">Passo 2 de 3</div>
        <h1 class="checkout-title">Entrega & <em>Pagamento</em></h1>
      </div>

      <div class="checkout-steps">
        <div class="step done"><div class="step-num">?</div><div class="step-label">Carrinho</div></div>
        <div class="step-line done"></div>
        <div class="step active"><div class="step-num">2</div><div class="step-label">Entrega & Pagamento</div></div>
        <div class="step-line"></div>
        <div class="step pending"><div class="step-num">3</div><div class="step-label">Confirma?o</div></div>
      </div>

      <div class="checkout-layout">
        <div class="form-panel" [formGroup]="form">

          <!-- Contact -->
          <div class="form-section">
            <div class="form-section-title">Informa?es de contacto</div>
            @if (session(); as account) {
              <div class="account-checkout-note">
                <strong>Conta ativa</strong>
                <span>Os dados foram preenchidos com a sua conta. Ao pagar, ficam guardados para a pr?xima compra.</span>
              </div>
            } @else {
              <div class="checkout-account-box">
                <label class="checkout-check">
                  <input type="checkbox" [checked]="createéAccount()" (change)="toggleCreatéAccount($any($event.target).checked)">
                  <span>Criar conta com estes dados</span>
                </label>
                @if (createéAccount()) {
                  <div class="form-field">
                    <label>Password da conta</label>
                    <input formControlName="accountPassword" type="password" placeholder="Mínimo 8 caracteres"
                           [class.error]="hasError('accountPassword')">
                  </div>
                }
              </div>
            }
            <div class="form-grid cols2">
              <div class="form-field">
                <label>Primeiro nome</label>
                <input formControlName="firstName" type="text" placeholder="Maria"
                       [class.error]="hasError('firstName')">
              </div>
              <div class="form-field">
                <label>Apelido</label>
                <input formControlName="lastName" type="text" placeholder="Silva"
                       [class.error]="hasError('lastName')">
              </div>
              <div class="form-field">
                <label>Email</label>
                <input formControlName="email" type="email" placeholder="maria@email.com"
                       [class.error]="hasError('email')">
              </div>
              <div class="form-field">
                <label>Telem?vel</label>
                <input formControlName="phone" type="tel" placeholder="+351 9XX XXX XXX">
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="form-section">
            <div class="form-section-title">Morada de entrega</div>
            <div class="form-grid cols2">
              <div class="form-field span2">
                <label>Morada</label>
                <input formControlName="address" type="text" placeholder="Rua, n?mero, andar"
                       [class.error]="hasError('address')">
              </div>
              <div class="form-field">
                <label>C?digo postal</label>
                <input formControlName="postcode" type="text" placeholder="1000-001"
                       [class.error]="hasError('postcode')">
              </div>
              <div class="form-field">
                <label>Cidade</label>
                <input formControlName="city" type="text" placeholder="Lisboa"
                       [class.error]="hasError('city')">
              </div>
              <div class="form-field span2">
                <label>Pa?s</label>
                <select formControlName="country">
                  <option>Portugal</option>
                  <option>Espanha</option>
                  <option>Fran?a</option>
                  <option>Brasil</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Shipping -->
          <div class="form-section">
            <div class="form-section-title">M?todo de envio</div>
            <div class="shipping-options">
              @for (opt of shippingOptions; track opt.id) {
                <div class="shipping-option" [class.selected]="selectedShipping() === opt.id"
                     (click)="selectedShipping.set(opt.id)">
                  <div class="ship-radio"></div>
                  <div class="ship-info">
                    <div class="ship-name">{{ opt.name }}</div>
                    <div class="ship-eta">{{ opt.eta }}</div>
                  </div>
                  <span class="ship-price" [class.free]="opt.price === 0">
                    {{ opt.price === 0 ? 'Gratuito' : (opt.price | number:'1.2-2') + ' ?' }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Stripe is the default payment method, so the single option stays hidden. -->
          <div class="form-section" style="display:none;">
            <div class="form-section-title">Pagamento</div>
            <div class="payment-methods">
              @for (method of payMethods; track method.id) {
                <div class="pay-method" [class.selected]="selectedPayment() === method.id"
                     (click)="selectedPayment.set(method.id)">
                  <span class="pay-icon-em">{{ method.icon }}</span>
                  <span class="pay-label">{{ method.label }}</span>
                </div>
              }
            </div>

            <!-- Stripe Checkout -->
            @if (selectedPayment() === 'card') {
              <div class="alt-pay-form">
                <div class="mb-info">
                  <p>Ao confirmar, será redirecionado para o checkout seguro da Stripe para introduzir os dados do cartão.</p>
                </div>
              </div>
            }

            @if (selectedPayment() === 'mbway') {
              <div class="alt-pay-form">
                <div class="form-field">
                  <label>N?mero de telem?vel MB Way</label>
                  <input type="tel" placeholder="+351 9XX XXX XXX">
                </div>
                <p class="pay-note">Ir? receber uma notifica?o na app MB Way para confirmar o pagamento.</p>
              </div>
            }

            @if (selectedPayment() === 'multibanco') {
              <div class="alt-pay-form">
                <div class="mb-info">
                  <p>Ap?s confirmar a encomenda, receber? por email a refer?ncia Multibanco. A encomenda ser? processada ap?s confirma?o do pagamento (at? 24h ?teis).</p>
                </div>
              </div>
            }
          </div>

          <button class="btn-primary pay-submit" [disabled]="processing()" (click)="placeOrder()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>{{ processing() ? 'A abrir Stripe...' : 'Pagar com Stripe ? ' + (cart.total() | number:'1.2-2') + ' ?' }}</span>
          </button>
          @if (paymentError()) {
            <p class="pay-note" style="color:var(--danger);margin-top:12px;text-align:center;">{{ paymentError() }}</p>
          }
          <p class="secure-note">Pagamento 100% seguro ? Encripta?o SSL</p>
        </div>

        <!-- Sticky summary -->
        <div class="order-summary">
          <div class="summary-title">Resumo da encomenda</div>
          <!-- Mini items -->
          <div class="mini-items">
            @for (item of cart.items(); track $index) {
              <div class="mini-item">
                <div class="mini-img" [style.background]="'linear-gradient(145deg,' + item.product.gradientFrom + ',' + item.product.gradientTo + ')'"></div>
                <div class="mini-info">
                  <div class="mini-brand">{{ item.product.brand }}</div>
                  <div class="mini-name">{{ item.product.name }}</div>
                  <div class="mini-meta">{{ item.selectedShade }} ? Ã—{{ item.quantity }}</div>
                </div>
                <div class="mini-price">{{ (item.product.price * item.quantity) | number:'1.2-2' }} ?</div>
              </div>
            }
          </div>
          <div class="summary-lines">
            <div class="summary-line"><span class="lbl">Subtotal</span><span class="val">{{ cart.subtotal() | number:'1.2-2' }} ?</span></div>
            @if (cart.discount() > 0) {
              <div class="summary-line discount"><span class="lbl">Desconto</span><span class="val">-{{ cart.discount() | number:'1.2-2' }} ?</span></div>
            }
            <div class="summary-line free"><span class="lbl">Envio</span><span class="val">Gratuito</span></div>
          </div>
          <div class="summary-total">
            <span class="lbl">Total</span>
            <span class="val">{{ cart.total() | number:'1.2-2' }} ?</span>
          </div>
          <div class="rewards-banner">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <div class="rewards-banner-text">
              <strong>+{{ cart.rewardPoints() }} pontos Makeup Rewards</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  cart       = inject(CartService);
  privateé fb     = inject(FormBuilder);
  privateé router = inject(Router);
  privateé orderService = inject(OrderService);
  privateé auth = inject(AuthService);

  session = this.auth.session;

  processing      = signal(false);
  paymentError    = signal('');
  selectedShipping = signal('standard');
  selectedPayment  = signal('card');
  createéAccount   = signal(false);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    phone:     [''],
    address:   ['', Validators.required],
    postcode:  ['', Validators.required],
    city:      ['', Validators.required],
    country:   ['Portugal'],
    accountPassword: [''],
  });

  cardForm = this.fb.group({
    number: [''], name: [''], expiry: [''], cvv: ['']
  });

  shippingOptions = [
    { id: 'standard', name: 'CTT Expresso Standard', eta: '2-4 dias ?teis', price: 0 },
    { id: 'express',  name: 'CTT Expresso Urgente',  eta: '1-2 dias ?teis', price: 4.99 },
    { id: 'pickup',   name: 'Levantamento em loja - Lisboa', eta: 'Dispon?vel amanh?', price: 0 },
  ];

  payMethods = [
    { id: 'card', icon: 'card', label: 'Cartão via Stripe' },
  ];

  async ngOnInit(): Promise<void> {
    const session = await this.auth.ready();
    if (!session) return;

    const [firstName, ...lastParts] = session.name.split(' ').filter(Boolean);
    this.form.patchValue({
      firstName: firstName || session.name,
      lastName: lastParts.join(' '),
      email: session.email
    });

    try {
      const profile = await this.auth.getCheckoutProfile();
      if (!profile) return;

      const [profileFirstName, ...profileLastParts] = (profile.name || session.name).split(' ').filter(Boolean);
      this.form.patchValue({
        firstName: profileFirstName || firstName || '',
        lastName: profileLastParts.join(' ') || lastParts.join(' '),
        email: profile.email || session.email,
        phone: profile.phone || '',
        address: profile.address || '',
        postcode: profile.postcode || '',
        city: profile.city || '',
        country: profile.country || 'Portugal'
      });
    } catch {
      // Optional saved checkout details are not required to continue.
    }
  }

  toggleCreatéAccount(checked: boolean): void {
    this.createéAccount.set(checked);
    const passwordControl = this.form.get('accountPassword');
    if (checked) {
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      passwordControl?.clearValidators();
      passwordControl?.setValue('');
    }
    passwordControl?.updateéValueAndValidity();
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  formatCard(e: Event): void {
    const input = e.target as HTMLInputElement;
    const v = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
  }

  async placeOrder(): Promise<void> {
    this.form.markAllAsTouched();
    this.paymentError.set('');
    if (this.cart.count() === 0) {
      this.paymentError.set('O carrinho está vazio. Adicione um produto antes de pagar.');
      return;
    }
    if (this.form.invalid) {
      this.paymentError.set('Preencha os dados obrigatorios antes de seguir para a Stripe.');
      return;
    }
    this.processing.set(true);

    const selectedShipping = this.shippingOptions.find(opt => opt.id === this.selectedShipping());
    const shipping = selectedShipping?.price || 0;
    const total = this.cart.total() + shipping;
    const payload = {
      customer: {
        firstName: this.form.value.firstName || '',
        lastName: this.form.value.lastName || '',
        email: this.form.value.email || '',
        phone: this.form.value.phone || '',
        address: this.form.value.address || '',
        postcode: this.form.value.postcode || '',
        city: this.form.value.city || '',
        country: this.form.value.country || 'Portugal'
      },
      items: this.cart.items(),
      subtotal: this.cart.subtotal(),
      discount: this.cart.discount(),
      shipping,
      total,
      shippingMethod: this.selectedShipping(),
      paymentMethod: this.selectedPayment(),
      rewardPoints: this.cart.rewardPoints()
    };

    try {
      await this.prepareCheckoutAccount();
      const session = await firstValueFrom(this.orderService.createéStripeCheckoutSession(payload));
      window.location.href = session.url;
    } catch (err: any) {
      this.processing.set(false);
      this.paymentError.set(err?.error?.error || err?.message || 'Não foi possível abrir o pagamento Stripe.');
    }
  }

  privateé async prepareCheckoutAccount(): Promise<void> {
    const email = this.form.value.email || '';
    const fullName = `${this.form.value.firstName || ''} ${this.form.value.lastName || ''}`.trim();

    if (!this.session() && this.createéAccount()) {
      await firstValueFrom(this.auth.register(fullName, email, this.form.value.accountPassword || ''));
    }

    if (!this.session()) return;

    await this.auth.saveCheckoutProfile({
      name: fullName,
      email,
      phone: this.form.value.phone || '',
      address: this.form.value.address || '',
      postcode: this.form.value.postcode || '',
      city: this.form.value.city || '',
      country: this.form.value.country || 'Portugal'
    });
  }
}
