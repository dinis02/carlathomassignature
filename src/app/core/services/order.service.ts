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
  private apiUrl = 'http://localhost:3000/api';

  createOrder(payload: CreateOrderPayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/orders`, payload);
  }
}
