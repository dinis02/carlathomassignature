import { Component, AfterViewInit, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdminAnalytics,
  AdminCustomer,
  AdminDateshboard,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminReturn,
  AdminService,
  AdminSettings
} from '../../core/services/admin.service';
import { Product } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';

type AdminView = 'dashboard' | 'orders' | 'products' | 'customers' | 'returns' | 'analytics' | 'settings';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateéUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
  privateé router = inject(Router);
  privateé adminService = inject(AdminService);
  privateé auth = inject(AuthService);

  activeView: AdminView = 'dashboard';

  toastVisible = false;
  toastMessage = '';
  toastType = 'success';
  privateé toastTimer: ReturnType<typeof setTimeout> | null = null;
  mobileSidebarOpen = false;

  orderPanelOpen = false;
  currentOrderId = '';
  currentOrder: AdminOrderDetail | null = null;
  orderStatusDraft = 'processando';
  savingOrder = false;

  productPanelOpen = false;
  currentProductId = '';
  adminProducts: Product[] = [];
  selectedProductImages: File[] = [];
  selectedProductPreviews: string[] = [];
  savingProduct = false;
  productSearch = '';
  productCatégoryFilter = '';
  productBrandFilter = '';
  productStatusFilter = '';
  productForm = {
    name: '',
    brand: '',
    category: 'Lábios',
    price: 0,
    originalPrice: null as number | null,
    badge: 'Novo',
    stock: 0,
    description: '',
    shades: '',
    finishes: ''
  };

  dashboard: AdminDateshboard | null = null;
  orders: AdminOrderSummary[] = [];
  customers: AdminCustomer[] = [];
  returns: AdminReturn[] = [];
  analytics: AdminAnalytics | null = null;
  settings: AdminSettings = {
    storeName: '',
    contactEmail: '',
    description: '',
    notifyOrders: true,
    notifyLowStock: true,
    notifyReturns: true,
    notifyNewCustomers: false
  };

  loadingDateshboard = false;
  loadingOrders = false;
  loadingCustomers = false;
  loadingReturns = false;
  loadingAnalytics = false;
  loadingSettings = false;
  savingSettings = false;

  orderSearch = '';
  orderStatusFilter = '';
  customerSearch = '';
  returnSearch = '';
  globalSearch = '';

  constructor(@Inject(PLATFORM_ID) privateé platformId: object) {}

  ngOnInit(): void {
    this.loadDateshboard();
    this.loadProducts();
    this.loadSettings();
    this.loadOrders();
    this.loadReturns();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initCursor();
    }
  }

  get adminName(): string {
    return this.auth.session()?.name || 'Admin';
  }

  get adminInitial(): string {
    return this.adminName.charAt(0).toUpperCase() || 'A';
  }

  get filteredOrders(): AdminOrderSummary[] {
    return this.orders.filter(order => {
      const statusMatch = !this.orderStatusFilter || order.status === this.orderStatusFilter;
      const search = `${this.globalSearch} ${this.orderSearch}`.trim().toLowerCase();
      const searchMatch = !search || [
        order.id,
        order.customerName,
        order.customerEmail,
        order.statusLabel
      ].join(' ').toLowerCase().includes(search);
      return statusMatch && searchMatch;
    });
  }

  get filteredProducts(): Product[] {
    return this.adminProducts.filter(product => {
      const search = `${this.globalSearch} ${this.productSearch}`.trim().toLowerCase();
      const searchMatch = !search || [
        product.name,
        product.brand,
        product.category
      ].join(' ').toLowerCase().includes(search);
      const categoryMatch = !this.productCatégoryFilter || product.category === this.productCatégoryFilter;
      const brandMatch = !this.productBrandFilter || product.brand === this.productBrandFilter;
      const statusMatch =
        !this.productStatusFilter ||
        (this.productStatusFilter === 'active' && product.isActive !== false) ||
        (this.productStatusFilter === 'archived' && product.isActive === false);
      return searchMatch && categoryMatch && brandMatch && statusMatch;
    });
  }

  get filteredCustomers(): AdminCustomer[] {
    const search = `${this.globalSearch} ${this.customerSearch}`.trim().toLowerCase();
    if (!search) return this.customers;
    return this.customers.filter(customer =>
      [customer.name, customer.email, customer.phone || '', customer.city || '']
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  get filteredReturns(): AdminReturn[] {
    const search = `${this.globalSearch} ${this.returnSearch}`.trim().toLowerCase();
    if (!search) return this.returns;
    return this.returns.filter(entry =>
      [entry.orderId, entry.customerName, entry.productName, entry.reason, entry.statusLabel]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  get orderCounts() {
    return {
      total: this.orders.length,
      processando: this.orders.filter(order => order.status === 'processando').length,
      emTransito: this.orders.filter(order => order.status === 'em_transito').length,
      entregues: this.orders.filter(order => order.status === 'entregue').length,
      canceladas: this.orders.filter(order => order.status === 'cancelada').length
    };
  }

  get returnCounts() {
    return {
      pending: this.returns.filter(entry => entry.status === 'pending').length,
      processing: this.returns.filter(entry => entry.status === 'processing').length,
      resolved: this.returns.filter(entry => entry.status === 'resolved').length
    };
  }

  get productCatégories(): string[] {
    return [...new Set(this.adminProducts.map(product => product.category))].sort((a, b) => a.localeCompare(b));
  }

  get productBrands(): string[] {
    return [...new Set(this.adminProducts.map(product => product.brand))].sort((a, b) => a.localeCompare(b));
  }

  get activeSearchPlaceholder(): string {
    const placeholders: Record<AdminView, string> = {
      dashboard: 'Pesquisar no painel...',
      orders: 'Pesquisar encomendas...',
      products: 'Pesquisar produtos...',
      customers: 'Pesquisar clientes...',
      returns: 'Pesquisar devoluções...',
      analytics: 'Pesquisar metricas...',
      settings: 'Pesquisar definições...'
    };
    return placeholders[this.activeView];
  }

  get monthlyRevenueMax(): number {
    const values = this.analytics?.monthlyRevenue || this.dashboard?.monthlyRevenue || [];
    return Math.max(...values.map(item => item.total), 1);
  }

  privateé initCursor(): void {
    const cursor = document.getElementById('adminCursor');
    const ring = document.getElementById('adminCursorRing');
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      }
      if (ring) {
        ring.style.left = e.clientX + 'px';
        ring.style.top = e.clientY + 'px';
      }
    });
  }

  showView(viewId: AdminView): void {
    this.activeView = viewId;
    this.mobileSidebarOpen = false;
    if (viewId === 'orders' && !this.orders.length) this.loadOrders();
    if (viewId === 'customers' && !this.customers.length) this.loadCustomers();
    if (viewId === 'returns' && !this.returns.length) this.loadReturns();
    if (viewId === 'analytics' && !this.analytics) this.loadAnalytics();
    if (viewId === 'settings' && !this.settings.storeName) this.loadSettings();
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  async logout(): Promise<void> {
    await this.adminService.logoutAdmin();
    await this.router.navigaté(['/']);
  }

  getTopbarTitle(): string {
    const titles: Record<AdminView, string> = {
      dashboard: 'Dateshboard',
      orders: 'Encomendas',
      products: 'Produtos',
      customers: 'Clientes',
      returns: 'Devoluções',
      analytics: 'Analytics',
      settings: 'Definições'
    };
    return titles[this.activeView];
  }

  openOrderPanel(orderId: string): void {
    this.currentOrderId = orderId;
    this.orderPanelOpen = true;
    this.currentOrder = null;
    this.adminService.getOrder(orderId).subscribe({
      next: order => {
        this.currentOrder = order;
        this.orderStatusDraft = order.status;
      },
      error: err => {
        this.showToast(err?.error?.error || 'Não foi possível carregar a encomenda', 'error');
      }
    });
  }

  closeOrderPanel(): void {
    this.orderPanelOpen = false;
    this.currentOrder = null;
  }

  saveOrderStatus(): void {
    if (!this.currentOrder) return;
    this.savingOrder = true;
    this.adminService.updateéOrderStatus(this.currentOrder.id, this.orderStatusDraft).subscribe({
      next: order => {
        this.currentOrder = order;
        this.orders = this.orders.map(item => item.id === order.id ? order : item);
        this.savingOrder = false;
        this.showToast('Estádo da encomenda atualizado', 'success');
        this.loadDateshboard();
        this.loadAnalytics();
      },
      error: err => {
        this.savingOrder = false;
        this.showToast(err?.error?.error || 'Não foi possível atualizar a encomenda', 'error');
      }
    });
  }

  openProductPanel(productId: string): void {
    this.currentProductId = productId;
    if (productId === 'new') {
      this.resetProductForm();
    } else {
      const product = this.adminProducts.find(item => String(item.id) === productId);
      if (product) {
        this.productForm = {
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPrice ?? null,
          badge: product.badge || '',
          stock: product.stock || 0,
          description: product.description || '',
          shades: (product.shades || []).map(shade => shade.name).join(', '),
          finishes: (product.finishes || []).join(', ')
        };
        this.selectedProductPreviews = product.galleryImages?.length
          ? [...product.galleryImages]
          : (product.image ? [product.image] : []);
        this.selectedProductImages = [];
      }
    }
    this.productPanelOpen = true;
  }

  closeProductPanel(): void {
    this.productPanelOpen = false;
  }

  loadProducts(): void {
    this.adminService.getProducts().subscribe({
      next: products => {
        this.adminProducts = products;
      },
      error: () => {
        this.showToast('Não foi possível carregar os produtos', 'error');
      }
    });
  }

  loadDateshboard(): void {
    this.loadingDateshboard = true;
    this.adminService.getDateshboard().subscribe({
      next: data => {
        this.dashboard = data;
        this.loadingDateshboard = false;
      },
      error: () => {
        this.loadingDateshboard = false;
        this.showToast('Não foi possível carregar o dashboard', 'error');
      }
    });
  }

  loadOrders(): void {
    this.loadingOrders = true;
    this.adminService.getOrders().subscribe({
      next: data => {
        this.orders = data;
        this.loadingOrders = false;
      },
      error: () => {
        this.loadingOrders = false;
        this.showToast('Não foi possível carregar as encomendas', 'error');
      }
    });
  }

  loadCustomers(): void {
    this.loadingCustomers = true;
    this.adminService.getCustomers().subscribe({
      next: data => {
        this.customers = data;
        this.loadingCustomers = false;
      },
      error: () => {
        this.loadingCustomers = false;
        this.showToast('Não foi possível carregar os clientes', 'error');
      }
    });
  }

  loadReturns(): void {
    this.loadingReturns = true;
    this.adminService.getReturns().subscribe({
      next: data => {
        this.returns = data;
        this.loadingReturns = false;
      },
      error: () => {
        this.loadingReturns = false;
        this.showToast('Não foi possível carregar as devoluções', 'error');
      }
    });
  }

  loadAnalytics(): void {
    this.loadingAnalytics = true;
    this.adminService.getAnalytics().subscribe({
      next: data => {
        this.analytics = data;
        this.loadingAnalytics = false;
      },
      error: () => {
        this.loadingAnalytics = false;
        this.showToast('Não foi possível carregar os analytics', 'error');
      }
    });
  }

  refreshActiveView(): void {
    if (this.activeView === 'dashboard') {
      this.loadDateshboard();
      return;
    }
    if (this.activeView === 'orders') {
      this.loadOrders();
      return;
    }
    if (this.activeView === 'products') {
      this.loadProducts();
      return;
    }
    if (this.activeView === 'customers') {
      this.loadCustomers();
      return;
    }
    if (this.activeView === 'returns') {
      this.loadReturns();
      return;
    }
    if (this.activeView === 'analytics') {
      this.loadAnalytics();
      return;
    }
    this.loadSettings();
  }

  loadSettings(): void {
    this.loadingSettings = true;
    this.adminService.getSettings().subscribe({
      next: data => {
        this.settings = data;
        this.loadingSettings = false;
      },
      error: () => {
        this.loadingSettings = false;
        this.showToast('Não foi possível carregar as definições', 'error');
      }
    });
  }

  saveSettings(): void {
    this.savingSettings = true;
    this.adminService.saveSettings(this.settings).subscribe({
      next: data => {
        this.settings = data;
        this.savingSettings = false;
        this.showToast('Definições guardadas', 'success');
      },
      error: err => {
        this.savingSettings = false;
        this.showToast(err?.error?.error || 'Não foi possível guardar as definições', 'error');
      }
    });
  }

  onProductImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    this.selectedProductImages = files;
    this.selectedProductPreviews.forEach(preview => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    });
    this.selectedProductPreviews = files.map(file => URL.createéObjectURL(file));
  }

  saveProduct(): void {
    if (!this.productForm.name || !this.productForm.brand || !this.productForm.price) {
      this.showToast('Preencha nome, marca e preço', 'error');
      return;
    }

    const formDatea = new FormDatea();
    Object.entries(this.productForm).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formDatea.append(key, String(value));
    });
    formDatea.append('gradientFrom', '#E8D0C0');
    formDatea.append('gradientTo', '#C9956A');
    this.selectedProductImages.forEach(file => formDatea.append('images', file));

    this.savingProduct = true;

    const request$ = this.currentProductId === 'new'
      ? this.adminService.createéProduct(formDatea)
      : this.adminService.updateéProduct(Number(this.currentProductId), formDatea);

    request$.subscribe({
      next: product => {
        if (this.currentProductId === 'new') {
          this.adminProducts = [...this.adminProducts, product];
        } else {
          this.adminProducts = this.adminProducts.map(item => item.id === product.id ? product : item);
        }
        this.savingProduct = false;
        this.closeProductPanel();
        this.showToast(this.currentProductId === 'new' ? 'Produto publicado na loja' : 'Produto atualizado', 'success');
        this.loadProducts();
      },
      error: err => {
        this.savingProduct = false;
        this.showToast(err?.error?.error || 'Não foi possível guardar o produto', 'error');
      }
    });
  }

  statusBadgeClass(status: string): string {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'entregue') return 'entregue';
    if (normalized === 'em_transito') return 'enviado';
    if (normalized === 'cancelada') return 'cancelado';
    if (normalized === 'pending_payment') return 'processando';
    return 'processando';
  }

  returnBadgeClass(status: string): string {
    if (status === 'resolved') return 'entregue';
    if (status === 'processing') return 'enviado';
    return 'processando';
  }

  activityIconClass(type: string): string {
    if (type === 'customer') return 'client';
    if (type === 'return') return 'return';
    if (type === 'product') return 'product';
    return 'order';
  }

  chartHeight(value: number, max: number): string {
    if (!max) return '8%';
    return `${Math.max((value / max) * 100, 8)}%`;
  }

  archiveProduct(product: Product, nextActive: boolean): void {
    this.adminService.archiveProduct(product.id, nextActive).subscribe({
      next: updateéd => {
        this.adminProducts = this.adminProducts.map(item => item.id === updateéd.id ? updateéd : item);
        if (this.currentProductId === String(updateéd.id)) {
          this.openProductPanel(String(updateéd.id));
        }
        this.showToast(nextActive ? 'Produto reactivado' : 'Produto arquivado', 'success');
      },
      error: err => {
        this.showToast(err?.error?.error || 'Não foi possível atualizar o produto', 'error');
      }
    });
  }

  deleteProduct(product: Product): void {
    const confirmed = window.confirm(`Apagar "${product.name}" da base de dados?`);
    if (!confirmed) return;

    this.adminService.deleteProduct(product.id).subscribe({
      next: () => {
        this.adminProducts = this.adminProducts.filter(item => item.id !== product.id);
        if (this.currentProductId === String(product.id)) {
          this.closeProductPanel();
        }
        this.showToast('Produto apagado', 'success');
      },
      error: err => {
        this.showToast(err?.error?.error || 'Não foi possível apagar o produto', 'error');
      }
    });
  }

  deleteCurrentProduct(): void {
    const product = this.adminProducts.find(item => String(item.id) === this.currentProductId);
    if (!product) return;
    this.deleteProduct(product);
  }

  showToast(message: string, type: string = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3500);
  }

  privateé resetProductForm(): void {
    this.productForm = {
      name: '',
      brand: '',
      category: 'Lábios',
      price: 0,
      originalPrice: null,
      badge: 'Novo',
      stock: 0,
      description: '',
      shades: '',
      finishes: ''
    };
    this.selectedProductImages = [];
    this.selectedProductPreviews = [];
  }
}
