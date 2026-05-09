import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Product } from '../models/models';

export interface AdminOrderItem {
  productId: number;
  productName: string;
  productBrand: string;
  unitPrice: number;
  quantity: number;
  selectedShade?: string | null;
  selectedFinish?: string | null;
}

export interface AdminOrderSummary {
  id: string;
  date: string;
  dateLabel: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  shippingMethod: string;
  total: number;
  status: string;
  statusLabel: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerPostcode?: string | null;
  customerCity?: string | null;
  customerCountry?: string | null;
  items: AdminOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  paymentMethod: string;
  paymentStatus: string;
  stripeSessionId?: string | null;
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  ordersCount: number;
  totalSpent: number;
  status: string;
  statusLabel: string;
  lastOrderAt?: string | null;
  lastOrderLabel: string;
}

export interface AdminReturn {
  id: number;
  orderId: string;
  customerName: string;
  productName: string;
  reason: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  createdLabel: string;
}

export interface AdminActivity {
  type: string;
  message: string;
  timeLabel: string;
}

export interface AdminChartPoint {
  label: string;
  total: number;
}

export interface AdminDashboard {
  revenueMonth: number;
  ordersMonth: number;
  averageOrderValue: number;
  pendingReturns: number;
  statusCounts: Record<string, number>;
  dailyRevenue: AdminChartPoint[];
  monthlyRevenue: AdminChartPoint[];
  recentOrders: AdminOrderSummary[];
  recentActivity: AdminActivity[];
}

export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newsletterSubscribers: number;
  monthlyRevenue: AdminChartPoint[];
}

export interface AdminSettings {
  storeName: string;
  contactEmail: string;
  description: string;
  notifyOrders: boolean;
  notifyLowStock: boolean;
  notifyReturns: boolean;
  notifyNewCustomers: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private apiUrl = '/api/admin';
  private adminLoggedIn = false;

  loginAsAdmin() {
    this.adminLoggedIn = true;
  }

  async logoutAdmin(): Promise<void> {
    this.adminLoggedIn = false;
    await this.auth.logout();
  }

  isAdmin() {
    return this.adminLoggedIn || this.auth.isAdmin();
  }

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.apiUrl}/dashboard`);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getOrders(): Observable<AdminOrderSummary[]> {
    return this.http.get<AdminOrderSummary[]>(`${this.apiUrl}/orders`);
  }

  getOrder(id: string): Observable<AdminOrderDetail> {
    return this.http.get<AdminOrderDetail>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(id: string, status: string): Observable<AdminOrderDetail> {
    return this.http.patch<AdminOrderDetail>(`${this.apiUrl}/orders/${id}`, { status });
  }

  getCustomers(): Observable<AdminCustomer[]> {
    return this.http.get<AdminCustomer[]>(`${this.apiUrl}/customers`);
  }

  getReturns(): Observable<AdminReturn[]> {
    return this.http.get<AdminReturn[]>(`${this.apiUrl}/returns`);
  }

  getAnalytics(): Observable<AdminAnalytics> {
    return this.http.get<AdminAnalytics>(`${this.apiUrl}/analytics`);
  }

  getSettings(): Observable<AdminSettings> {
    return this.http.get<AdminSettings>(`${this.apiUrl}/settings`);
  }

  saveSettings(settings: AdminSettings): Observable<AdminSettings> {
    return this.http.put<AdminSettings>(`${this.apiUrl}/settings`, settings);
  }

  updateProduct(id: number, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`/api/products/${id}`, formData);
  }

  archiveProduct(id: number, isActive: boolean): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/archive`, { isActive });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }
}
