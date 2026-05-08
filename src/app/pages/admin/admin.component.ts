import { Component, AfterViewInit, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { Product } from '../../core/models/models';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
  activeView = 'dashboard';

  toastVisible = false;
  toastMessage = '';
  toastType = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  orderPanelOpen = false;
  currentOrderId = '';

  productPanelOpen = false;
  currentProductId = '';
  adminProducts: Product[] = [];
  selectedProductImage: File | null = null;
  selectedProductPreview = '';
  savingProduct = false;
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router,
    private adminService: AdminService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initCursor();
    }
  }

  private initCursor(): void {
    const cursor = document.getElementById('adminCursor');
    const ring = document.getElementById('adminCursorRing');
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (cursor) { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }
      if (ring) { ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px'; }
    });
  }

  showView(viewId: string): void {
    this.activeView = viewId;
  }

  logout(): void {
    this.adminService.logoutAdmin();
    this.router.navigate(['/']);
  }

  getTopbarTitle(): string {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      orders: 'Encomendas',
      products: 'Produtos',
      customers: 'Clientes',
      returns: 'Devoluções',
      analytics: 'Analytics',
      settings: 'Definições'
    };
    return titles[this.activeView] || 'Dashboard';
  }

  filterTable(tableId: string, value: string): void {
    const table = document.getElementById(tableId) as HTMLTableElement | null;
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const text = (row as HTMLElement).textContent?.toLowerCase() ?? '';
      (row as HTMLElement).style.display = text.includes(value.toLowerCase()) ? '' : 'none';
    });
  }

  filterTableByCol(tableId: string, colIndex: number, value: string): void {
    const table = document.getElementById(tableId) as HTMLTableElement | null;
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cell = row.querySelectorAll('td')[colIndex];
      const match = !value || (cell?.textContent?.toLowerCase() ?? '').includes(value.toLowerCase());
      (row as HTMLElement).style.display = match ? '' : 'none';
    });
  }

  openOrderPanel(orderId: string): void {
    this.currentOrderId = orderId;
    this.orderPanelOpen = true;
  }

  closeOrderPanel(): void {
    this.orderPanelOpen = false;
  }

  openProductPanel(productId: string): void {
    this.currentProductId = productId;
    if (productId === 'new') this.resetProductForm();
    this.productPanelOpen = true;
  }

  closeProductPanel(): void {
    this.productPanelOpen = false;
  }

  loadProducts(): void {
    this.productService.loadAll().subscribe(products => {
      this.adminProducts = products;
    });
  }

  onProductImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedProductImage = file;
    this.selectedProductPreview = URL.createObjectURL(file);
  }

  saveProduct(): void {
    if (!this.productForm.name || !this.productForm.brand || !this.productForm.price) {
      this.showToast('Preencha nome, marca e preço', 'error');
      return;
    }

    const formData = new FormData();
    Object.entries(this.productForm).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    formData.append('gradientFrom', '#E8D0C0');
    formData.append('gradientTo', '#C9956A');
    if (this.selectedProductImage) formData.append('image', this.selectedProductImage);

    this.savingProduct = true;
    this.productService.createProduct(formData).subscribe({
      next: product => {
        this.adminProducts = [...this.adminProducts, product];
        this.savingProduct = false;
        this.closeProductPanel();
        this.showToast('Produto publicado na loja', 'success');
      },
      error: err => {
        this.savingProduct = false;
        this.showToast(err?.error?.error || 'Não foi possível guardar o produto', 'error');
      }
    });
  }

  private resetProductForm(): void {
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
    this.selectedProductImage = null;
    this.selectedProductPreview = '';
  }

  showToast(message: string, type: string = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}
