import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface CreateOrderPayload {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    address: string;
    postcode: string;
    city: string;
    country: string;
  };
  items: unknown[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  rewardPoints: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  createOrder(payload: CreateOrderPayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/orders`, payload);
  }

  createStripeCheckoutSession(payload: CreateOrderPayload): Observable<{ id: string; url: string }> {
    return this.http.post<{ id: string; url: string }>(
      `${this.apiUrl}/payments/create-checkout-session`,
      payload
    );
  }

  getStripeSessionStatus(sessionId: string): Observable<{
    orderId: string | null;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
  }> {
    return this.http.get<{
      orderId: string | null;
      status: string;
      paymentStatus: string;
      total: number;
      currency: string;
    }>(`${this.apiUrl}/payments/session-status?session_id=${encodeURIComponent(sessionId)}`);
  }
}
