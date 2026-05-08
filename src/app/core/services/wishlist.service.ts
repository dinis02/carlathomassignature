import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';

const SUPABASE_URL = 'https://bqybxaqfhrqwejqkuams.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3Ne9SW7GFtMTjOVrr9GCtA_OJH0keOD';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private auth = inject(AuthService);
  private supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  private wishlistIds = signal<number[]>([]);
  ids = computed(() => this.wishlistIds());

  async load(): Promise<number[]> {
    const account = this.auth.session();
    if (!account) {
      this.wishlistIds.set([]);
      return [];
    }

    const { data, error } = await this.supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', account.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const ids = (data || []).map(row => Number(row.product_id));
    this.wishlistIds.set(ids);
    return ids;
  }

  isSaved(productId: number): boolean {
    return this.wishlistIds().includes(productId);
  }

  async toggle(productId: number): Promise<boolean> {
    const account = this.auth.session();
    if (!account) throw new Error('Entre na sua conta para guardar produtos na wishlist.');

    if (this.isSaved(productId)) {
      await this.remove(productId);
      return false;
    }

    const { error } = await this.supabase
      .from('wishlist_items')
      .insert({ user_id: account.id, product_id: productId });

    if (error) throw error;

    this.wishlistIds.update(ids => [productId, ...ids.filter(id => id !== productId)]);
    return true;
  }

  async remove(productId: number): Promise<void> {
    const account = this.auth.session();
    if (!account) throw new Error('Sessao expirada. Entre novamente.');

    const { error } = await this.supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', account.id)
      .eq('product_id', productId);

    if (error) throw error;

    this.wishlistIds.update(ids => ids.filter(id => id !== productId));
  }
}
