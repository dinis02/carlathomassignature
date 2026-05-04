import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements AfterViewInit {
  activeView = 'dashboard';

  toastVisible = false;
  toastMessage = '';
  toastType = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  orderPanelOpen = false;
  currentOrderId = '';

  productPanelOpen = false;
  currentProductId = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router,
    private adminService: AdminService
  ) {}

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
    this.productPanelOpen = true;
  }

  closeProductPanel(): void {
    this.productPanelOpen = false;
  }

  showToast(message: string, type: string = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}
