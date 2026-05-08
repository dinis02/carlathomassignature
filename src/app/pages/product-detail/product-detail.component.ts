import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    @if (product) {
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <div class="bc-inner">
          <a routerLink="/">Início</a><span class="sep">—</span>
          <a routerLink="/produtos">Maquilhagem</a><span class="sep">—</span>
          <a [routerLink]="['/produtos']" [queryParams]="{cat: product.category}">{{ product.category }}</a><span class="sep">—</span>
          <span class="cur">{{ product.name }}</span>
        </div>
      </div>

      <!-- Product detail -->
      <div class="product-detail">

        <!-- Gallery -->
        <div class="gallery">
          <div class="gallery-main">
            @if (product.image) {
              <img class="gallery-photo" [src]="product.image" [alt]="product.name">
            } @else {
              <div class="gallery-img"
                   [style.background]="'linear-gradient(145deg,' + thumbBgs[activeThumb()] + ')'">
              </div>
            }
            <div class="gallery-zoom-hint">+ Ampliar</div>
          </div>
          <div class="gallery-thumbs">
            @if (product.image) {
              <div class="gallery-thumb active">
                <img class="gallery-thumb-photo" [src]="product.image" [alt]="product.name">
              </div>
            } @else {
              @for (bg of thumbBgs; track $index) {
                <div class="gallery-thumb" [class.active]="activeThumb() === $index"
                     [style.background]="'linear-gradient(145deg,' + bg + ')'"
                     (click)="activeThumb.set($index)">
                </div>
              }
            }
          </div>
        </div>

        <!-- Info panel -->
        <div class="info-panel">
          <div class="meta-top">
            <span class="brand-tag">{{ product.brand }}</span>
            <div class="share-btns">
              <button
                class="share-btn"
                [class.saved]="isWishlistSaved()"
                [title]="isWishlistSaved() ? 'Remover da wishlist' : 'Guardar na wishlist'"
                (click)="toggleWishlist()">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
            </div>
          </div>

          <h1 class="product-title" [innerHTML]="formattedTitle"></h1>

          <div class="rating-row">
            <div class="stars">
              @for (s of starsArray(product.rating); track $index) {
                <svg class="star" [class.empty]="!s" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              }
            </div>
            <span class="rating-score">{{ product.rating }}</span>
            <span class="sep">·</span>
            <span class="rating-count">{{ product.reviewCount }} avaliações</span>
          </div>

          <div class="price-block">
            <span class="price-main">{{ product.price | number:'1.2-2' }} €</span>
            @if (product.originalPrice) {
              <span class="price-original">{{ product.originalPrice | number:'1.2-2' }} €</span>
              <span class="price-badge">-{{ discount() }}%</span>
            }
          </div>

          <!-- Shades -->
          @if (product.shades?.length) {
            <div class="option-group">
              <div class="option-label">
                Tom — <span>{{ selectedShade() }}</span>
              </div>
              <div class="shade-list">
                @for (shade of product.shades!; track shade.name) {
                  <button class="shade-btn" [class.active]="selectedShade() === shade.name"
                          [style.background]="shade.color"
                          [title]="shade.name"
                          (click)="selectedShade.set(shade.name)">
                  </button>
                }
              </div>
            </div>
          }

          <!-- Finish -->
          @if (product.finishes?.length) {
            <div class="option-group">
              <div class="option-label">
                Acabamento — <span>{{ selectedFinish() }}</span>
              </div>
              <div class="finish-list">
                @for (f of product.finishes!; track f) {
                  <button class="finish-btn" [class.active]="selectedFinish() === f"
                          (click)="selectedFinish.set(f)">{{ f }}</button>
                }
              </div>
            </div>
          }

          <!-- Qty -->
          <div class="qty-row">
            <div class="qty-control">
              <button class="qty-btn" (click)="changeQty(-1)">−</button>
              <span class="qty-val">{{ qty() }}</span>
              <button class="qty-btn" (click)="changeQty(1)">+</button>
            </div>
            <span class="stock-badge">✓ Em stock — pronto a enviar</span>
          </div>

          <!-- CTAs -->
          <div class="cta-block">
            <button class="btn-primary" [class.added]="justAdded()" (click)="addToCart()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span>{{ justAdded() ? '✓ Adicionado ao carrinho' : 'Adicionar ao carrinho' }}</span>
            </button>
            <button class="btn-primary rose" (click)="buyNow()">
              <span>Comprar agora</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>
            <button class="btn-secondary" [class.saved]="isWishlistSaved()" (click)="toggleWishlist()">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {{ isWishlistSaved() ? 'Guardado na wishlist' : 'Guardar na wishlist' }}
            </button>
          </div>

          <!-- Trust -->
          <div class="trust-row">
            <div class="trust-item">
              <svg class="trust-icon" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              <div class="trust-text"><strong>Entrega gratuita</strong>acima de 19€</div>
            </div>
            <div class="trust-item">
              <svg class="trust-icon" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="m9 12 2 2 4-4"/></svg>
              <div class="trust-text"><strong>Devoluções fáceis</strong>30 dias</div>
            </div>
            <div class="trust-item">
              <svg class="trust-icon" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <div class="trust-text"><strong>Pagamento seguro</strong>SSL 256-bit</div>
            </div>
          </div>

          <!-- Accordion -->
          <div class="accordion">
            @for (item of accordion; track item.title) {
              <div class="accordion-item" [class.open]="item.open">
                <button class="accordion-trigger" (click)="item.open = !item.open">
                  {{ item.title }}
                  <span class="accordion-icon">+</span>
                </button>
                <div class="accordion-body">
                  <div class="accordion-body-inner">{{ item.content }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Related -->
      <div class="related-section">
        <div class="related-inner">
          <div class="related-header">
            <div>
              <div class="section-label">Completa o look</div>
              <h2 class="section-title">Pode também gostar</h2>
            </div>
          </div>
          <div class="related-grid">
            @for (rel of related; track rel.id) {
              <a [routerLink]="['/produto', rel.id]" class="rel-card">
                <div class="rel-img" [style.background]="rel.image ? 'none' : 'linear-gradient(145deg,' + rel.gradientFrom + ',' + rel.gradientTo + ')'">
                  @if (rel.image) {
                    <img class="rel-photo" [src]="rel.image" [alt]="rel.name">
                  }
                </div>
                <div class="rel-info">
                  <div class="rel-brand">{{ rel.brand }}</div>
                  <div class="rel-name">{{ rel.name }}</div>
                  <div class="rel-price">{{ rel.price | number:'1.2-2' }} €</div>
                </div>
              </a>
            }
          </div>
        </div>
      </div>
    } @else {
      <div style="padding:120px;text-align:center;color:var(--text-muted);">
        Produto não encontrado.
        <a routerLink="/produtos" class="btn-ghost" style="margin-top:20px;">← Ver todos os produtos</a>
      </div>
    }
  `,
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  private productSvc = inject(ProductService);
  private cartSvc    = inject(CartService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private sanitizer  = inject(DomSanitizer);
  private wishlist   = inject(WishlistService);

  product: Product | undefined;
  related: Product[] = [];

  activeThumb  = signal(0);
  selectedShade  = signal('');
  selectedFinish = signal('');
  qty       = signal(1);
  justAdded = signal(false);

  thumbBgs = [
    '#C9A08A,#A07050', '#D4B0A0,#C09080',
    '#B09080,#907060', '#2A2220,#1A1814'
  ];

  get formattedTitle(): SafeHtml {
    if (!this.product) return '';
    const words = this.product.name.split(' ');
    const last = words.pop()!;
    const html = words.join(' ') + (words.length ? ' ' : '') + `<em>${last}</em>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  get accordion() {
    const p = this.product!;
    return [
      { title: 'Descrição',       content: p.description   || 'Sem descrição disponível.', open: true  },
      { title: 'Como aplicar',    content: p.howToApply    || 'Consulte a embalagem.',      open: false },
      { title: 'Ingredientes',    content: p.ingredients   || 'Consulte a embalagem.',      open: false },
      { title: 'Entrega & Devoluções', content: 'Entrega standard (2–4 dias úteis) gratuita acima de 19€. Devoluções até 30 dias.', open: false },
    ];
  }

  discount(): number {
    if (!this.product?.originalPrice) return 0;
    return Math.round((1 - this.product.price / this.product.originalPrice) * 100);
  }

  ngOnInit(): void {
    void this.wishlist.load().catch(() => undefined);

    this.route.params.subscribe(p => {
      const id = +p['id'];
      this.productSvc.loadAll().subscribe(() => this.setProduct(id));
    });
  }

  private setProduct(id: number): void {
    this.product = this.productSvc.getById(id);
    if (this.product) {
      this.related = this.productSvc.getRelated(id);
      this.selectedShade.set(this.product.shades?.[0]?.name ?? '');
      this.selectedFinish.set(this.product.finishes?.[0] ?? '');
      this.activeThumb.set(0);
      this.qty.set(1);
    }
  }

  changeQty(d: number): void { this.qty.set(Math.max(1, this.qty() + d)); }

  addToCart(): void {
    if (!this.product) return;
    this.cartSvc.add(this.product, this.selectedShade(), this.selectedFinish(), this.qty());
    this.justAdded.set(true);
    setTimeout(() => this.justAdded.set(false), 2000);
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/carrinho']);
  }

  isWishlistSaved(): boolean {
    return !!this.product && this.wishlist.isSaved(this.product.id);
  }

  toggleWishlist(): void {
    if (!this.product) return;
    void this.wishlist.toggle(this.product.id).catch(err => {
      window.alert(err?.message || 'Nao foi possivel guardar na wishlist.');
    });
  }

  starsArray(r: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(r));
  }
}
