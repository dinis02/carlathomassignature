import { Component, OnInit, inject, AfterViewInit, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <!-- Page hero -->
    <div class="page-hero">
      <div class="page-hero-inner">
        <div class="breadcrumb">
          <a routerLink="/">Início</a>
          <span class="sep">—</span>
          <span>{{ activeCategory() }}</span>
        </div>
        <div class="page-hero-content">
          <h1 class="page-hero-title">
            {{ titlePrefix }}<em>{{ titleSuffix }}</em>
          </h1>
          <div class="page-hero-meta">
            <div class="page-hero-count">{{ filtered().length }}</div>
            <div class="page-hero-count-label">produtos encontrados</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category pills -->
    <div class="category-bar">
      <div class="category-bar-inner">
        @for (cat of cats; track cat) {
          <button class="cat-pill" [class.active]="activeCategory() === cat"
                  (click)="setCategory(cat)">{{ cat }}</button>
        }
      </div>
    </div>

    <!-- Layout -->
    <div class="shop-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Active filters -->
        @if (activeBrands().length > 0) {
          <div class="active-filters">
            @for (b of activeBrands(); track b) {
              <div class="active-filter" (click)="toggleBrand(b)">
                {{ b }} <span>+</span>
              </div>
            }
            <button class="clear-all" (click)="clearFilters()">Limpar tudo</button>
          </div>
        }

        <!-- Brand filter -->
        <div class="filter-section">
          <div class="filter-title">Marca</div>
          <div class="filter-list">
            @for (brand of brands; track brand.name) {
              <label class="filter-item" [class.checked]="activeBrands().includes(brand.name)"
                     (click)="toggleBrand(brand.name)">
                <div class="filter-check"></div>
                <span class="filter-label">{{ brand.name }}</span>
                <span class="filter-count">{{ brand.count }}</span>
              </label>
            }
          </div>
        </div>

        <!-- Price -->
        <div class="filter-section">
          <div class="filter-title">Preço máximo</div>
          <div class="price-range">
            <input type="range" min="10" max="200" [value]="maxPrice()"
                   (input)="maxPrice.set(+$any($event.target).value)" class="price-slider-input">
            <div class="price-labels">
              <span>0 €</span>
              <span>até {{ maxPrice() }} €</span>
            </div>
          </div>
        </div>

        <!-- Quick filters -->
        <div class="filter-section">
          <div class="filter-title">Filtros rápidos</div>
          <div class="filter-list">
            <label class="filter-item" [class.checked]="showNew()" (click)="showNew.set(!showNew())">
              <div class="filter-check"></div>
              <span class="filter-label">Novidades</span>
            </label>
            <label class="filter-item" [class.checked]="showSale()" (click)="showSale.set(!showSale())">
              <div class="filter-check"></div>
              <span class="filter-label">Em promoção</span>
            </label>
          </div>
        </div>
      </aside>

      <!-- Products area -->
      <main class="products-area">
        <!-- Toolbar -->
        <div class="toolbar">
          <span class="results-count">
            <strong>{{ filtered().length }}</strong> produtos
          </span>
          <div class="toolbar-right">
            <select [(ngModel)]="sortBy" class="sort-select">
              <option value="default">Mais relevantes</option>
              <option value="price-asc">Preço: menor → maior</option>
              <option value="price-desc">Preço: maior → menor</option>
              <option value="rating">Melhor avaliados</option>
            </select>
            <div class="view-toggle">
              <button class="view-btn" [class.active]="viewMode==='grid'" (click)="viewMode='grid'">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><rect x="0" y="0" width="6" height="6"/><rect x="10" y="0" width="6" height="6"/><rect x="0" y="10" width="6" height="6"/><rect x="10" y="10" width="6" height="6"/></svg>
              </button>
              <button class="view-btn" [class.active]="viewMode==='list'" (click)="viewMode='list'">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><rect x="0" y="0" width="16" height="3"/><rect x="0" y="6" width="16" height="3"/><rect x="0" y="12" width="16" height="3"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Grid -->
        <div class="products-grid" [class.list-view]="viewMode==='list'">
          @for (product of sorted(); track product.id) {
            <a [routerLink]="['/produto', product.id]" class="product-card">
              <div class="product-image">
                @if (product.image) {
                  <img class="product-photo" [src]="product.image" [alt]="product.name">
                } @else {
                  <div class="img-placeholder"
                    [style.background]="'linear-gradient(145deg,' + product.gradientFrom + ',' + product.gradientTo + ')'">
                  </div>
                }
                @if (product.badge) {
                  <span class="product-badge" [class.dark]="product.badgeDark">{{ product.badge }}</span>
                }
                <div class="product-actions" (click)="$event.preventDefault()">
                  <button class="product-action-btn wishlist-active" title="Wishlist"></button>
                </div>
              </div>
              <div class="product-info">
                <div class="product-brand">{{ product.brand }}</div>
                <div class="product-name"><em>{{ product.name }}</em></div>
                <div class="product-rating">
                  <div class="stars">
                    @for (s of starsArray(product.rating); track $index) {
                      <svg class="star" [class.empty]="!s" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    }
                  </div>
                  <span class="rating-count">({{ product.reviewCount }})</span>
                </div>
                <div class="product-price">
                  @if (product.originalPrice) {
                    <span class="original">{{ product.originalPrice | number:'1.2-2' }} €</span>
                    <span class="saving">poupa {{ (product.originalPrice - product.price) | number:'1.2-2' }} €</span>
                  }
                  {{ product.price | number:'1.2-2' }} €
                </div>
              </div>
              <button class="quick-add" (click)="addToCart($event, product)">Adicionar ao carrinho</button>
            </a>
          }
        </div>

        <!-- Empty state -->
        @if (sorted().length === 0) {
          <div class="empty-state">
            <svg width="48" height="48" fill="none" stroke="var(--text-muted)" stroke-width="1" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            <p>Nenhum produto encontrado com os filtros seleccionados.</p>
            <button class="btn-ghost" (click)="clearFilters()">Limpar filtros</button>
          </div>
        }
      </main>
    </div>
  `,
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, AfterViewInit {
  private productSvc = inject(ProductService);
  private cartSvc    = inject(CartService);
  private route      = inject(ActivatedRoute);

  allProducts = signal<Product[]>(this.productSvc.getAll());

  activeCategory = signal('Todos');
  activeBrands   = signal<string[]>([]);
  maxPrice       = signal(200);
  showNew        = signal(false);
  showSale       = signal(false);
  sortBy         = 'default';
  viewMode       = 'grid';

  cats = ['Todos', 'Lábios', 'Rosto', 'Acessórios'];

  // Category groups map umbrella categories (like 'Maquilhagem') to one or more
  // product category values used in the product data. This lets header links
  // use friendly names while products are stored with more specific categories.
  private CATEGORY_GROUPS: Record<string, string[]> = {
    'Maquilhagem': ['Lábios', 'Rosto'],
    // add other groups here if needed
  };

  brands = [
    { name: 'Charlotte Tilbury', count: 4 },
    { name: 'NARS',              count: 2 },
    { name: 'Dior Beauty',       count: 1 },
    { name: 'Armani Beauty',     count: 1 },
    { name: 'La Mer',            count: 1 },
    { name: 'Carla Thomas',      count: 1 },
    { name: 'Sana Jardin',       count: 1 },
  ];

  get titlePrefix(): string {
    const c = this.activeCategory();
    if (c === 'Todos') return 'Todos os ';
    const half = Math.ceil(c.length / 2);
    return c.slice(0, half);
  }
  get titleSuffix(): string {
    const c = this.activeCategory();
    if (c === 'Todos') return 'produtos';
    const half = Math.ceil(c.length / 2);
    return c.slice(half);
  }

  filtered = computed(() => {
    let items = this.allProducts();
    const cat = this.activeCategory();
    if (cat !== 'Todos') {
      // If the category is a group (e.g. 'Maquilhagem'), expand to its members
      if (this.CATEGORY_GROUPS[cat]) {
        const members = this.CATEGORY_GROUPS[cat];
        items = items.filter(p => members.includes(p.category));
      } else {
        items = items.filter(p => p.category === cat);
      }
    }
    const brands = this.activeBrands();
    if (brands.length) items = items.filter(p => brands.includes(p.brand));
    items = items.filter(p => p.price <= this.maxPrice());
    if (this.showNew()) items = items.filter(p => p.badge === 'Novo');
    if (this.showSale()) items = items.filter(p => !!p.originalPrice);
    return items;
  });

  sorted = computed(() => {
    const items = [...this.filtered()];
    switch (this.sortBy) {
      case 'price-asc':  return items.sort((a,b) => a.price - b.price);
      case 'price-desc': return items.sort((a,b) => b.price - a.price);
      case 'rating':     return items.sort((a,b) => b.rating - a.rating);
      default:           return items;
    }
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      if (p['cat']) this.activeCategory.set(p['cat']);
    });

    this.productSvc.loadAll().subscribe(products => {
      this.allProducts.set(products);
      this.refreshBrandCounts(products);
    });

    // Ensure the products grid gets the fallback class early. In some
    // navigation scenarios the component may be reused and ngAfterViewInit
    // won't run again, so add the helper class on init (after render).
    setTimeout(() => {
      const grid = document.querySelector('.products-grid');
      if (grid) grid.classList.add('always-visible');
    }, 0);
  }

  ngAfterViewInit(): void {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.product-card').forEach(el => obs.observe(el));

    // Ensure products are visible immediately as a fallback in case the observer
    // doesn't run (older browsers or timing). This adds a helper class that
    // is styled in the component SCSS to override the hidden initial state.
    const grid = document.querySelector('.products-grid');
    if (grid) grid.classList.add('always-visible');
  }

  setCategory(cat: string): void { this.activeCategory.set(cat); }

  toggleBrand(brand: string): void {
    this.activeBrands.update(bs =>
      bs.includes(brand) ? bs.filter(b => b !== brand) : [...bs, brand]
    );
  }

  clearFilters(): void {
    this.activeBrands.set([]);
    this.maxPrice.set(200);
    this.showNew.set(false);
    this.showSale.set(false);
    this.activeCategory.set('Todos');
  }

  addToCart(e: Event, product: Product): void {
    e.preventDefault(); e.stopPropagation();
    this.cartSvc.add(product);
  }

  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  private refreshBrandCounts(products: Product[]): void {
    const counts = new Map<string, number>();
    products.forEach(product => counts.set(product.brand, (counts.get(product.brand) || 0) + 1));
    this.brands = [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }
}
