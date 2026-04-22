import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);

  items = this._items.asReadonly();

  count = computed(() => this._items().reduce((a, i) => a + i.quantity, 0));

  subtotal = computed(() =>
    this._items().reduce((a, i) => a + i.product.price * i.quantity, 0)
  );

  discount = signal(0);
  appliedCoupon = signal('');

  total = computed(() => Math.max(0, this.subtotal() - this.discount()));

  rewardPoints = computed(() => Math.floor(this.total() * 1));

  add(product: Product, shade?: string, finish?: string, qty = 1): void {
    const existing = this._items().find(
      i => i.product.id === product.id &&
           i.selectedShade === shade &&
           i.selectedFinish === finish
    );
    if (existing) {
      this._items.update(items =>
        items.map(i => i === existing ? { ...i, quantity: i.quantity + qty } : i)
      );
    } else {
      this._items.update(items => [
        ...items,
        { product, quantity: qty, selectedShade: shade, selectedFinish: finish }
      ]);
    }
  }

  updateQty(index: number, qty: number): void {
    if (qty < 1) { this.remove(index); return; }
    this._items.update(items =>
      items.map((item, i) => i === index ? { ...item, quantity: qty } : item)
    );
  }

  remove(index: number): void {
    this._items.update(items => items.filter((_, i) => i !== index));
  }

  applyCoupon(code: string): boolean {
    const valid: Record<string, number> = { 'CARLA10': 0.1, 'REWARDS': 0.1 };
    const pct = valid[code.toUpperCase()];
    if (pct) {
      this.discount.set(parseFloat((this.subtotal() * pct).toFixed(2)));
      this.appliedCoupon.set(code.toUpperCase());
      return true;
    }
    return false;
  }

  clear(): void {
    this._items.set([]);
    this.discount.set(0);
    this.appliedCoupon.set('');
  }
}
