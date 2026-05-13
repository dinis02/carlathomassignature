import { Injectable, signal } from '@angular/core';
import { Observable, from, switchMap, tap } from 'rxjs';
import { AuthError, Session, SupabaseClient, User, createClient } from '@supabase/supabase-js';

export type AccountRole = 'admin' | 'user';

export interface AccountSession {
  id: string;
  role: AccountRole;
  name: string;
  email: string;
  username?: string | null;
}

export interface CheckoutProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
}

interface ProfileRow {
  id: string;
  role: AccountRole;
  name: string | null;
  email: string | null;
  phone?: string | null;
  address?: string | null;
  postcode?: string | null;
  city?: string | null;
  country?: string | null;
}

const SUPABASE_URL = 'https://bqybxaqfhrqwejqkuams.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3Ne9SW7GFtMTjOVrr9GCtA_OJH0keOD';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  session = signal<AccountSession | null>(null);
  private initPromise = this.init();

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, authSession) => {
      const user = authSession?.user;
      if (!user) {
        this.session.set(null);
        return;
      }
      void this.loadAccount(user)
        .then(account => this.session.set(account))
        .catch(() => this.session.set(null));
    });
  }

  ready(): Promise<AccountSession | null> {
    return this.initPromise.then(() => this.session());
  }

  login(email: string, password: string): Observable<AccountSession> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      switchMap(({ data, error }) => this.handleAuthResult(data.user, error)),
      tap(account => this.session.set(account))
    );
  }

  register(name: string, email: string, password: string): Observable<AccountSession> {
    return from(this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })).pipe(
      switchMap(({ data, error }) => this.handleRegisterResult(data.user, data.session, error, name, email)),
      tap(account => this.session.set(account))
    );
  }

  signInWithGoogle(): Promise<void> {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    }).then(({ error }) => {
      if (error) throw error;
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  async updateAccount(name: string, email: string): Promise<AccountSession> {
    const current = this.session();
    if (!current) throw new Error('Sessão expirada. Entre novamente.');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const { error: metadataError } = await this.supabase.auth.updateUser({
      email: cleanEmail === current.email ? undefined : cleanEmail,
      data: { name: cleanName }
    });
    if (metadataError) throw metadataError;

    const { error: profileError } = await this.supabase
      .from('profiles')
      .update({ name: cleanName, email: cleanEmail })
      .eq('id', current.id);
    if (profileError) throw profileError;

    const updated = {
      ...current,
      name: cleanName,
      email: cleanEmail
    };
    this.session.set(updated);
    return updated;
  }

  async getCheckoutProfile(): Promise<CheckoutProfile | null> {
    const current = this.session();
    if (!current) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('name, email, phone, address, postcode, city, country')
      .eq('id', current.id)
      .maybeSingle<CheckoutProfile>();

    if (error) throw error;
    return data;
  }

  async saveCheckoutProfile(profile: CheckoutProfile): Promise<void> {
    const current = this.session();
    if (!current) throw new Error('Sessão expirada. Entre novamente.');

    const cleanProfile = {
      name: profile.name.trim(),
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone.trim(),
      address: profile.address.trim(),
      postcode: profile.postcode.trim(),
      city: profile.city.trim(),
      country: profile.country || 'Portugal',
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('profiles')
      .update(cleanProfile)
      .eq('id', current.id);

    if (error) throw error;

    this.session.set({
      ...current,
      name: cleanProfile.name,
      email: cleanProfile.email
    });
  }

  async logout(): Promise<void> {
    this.session.set(null);
    await this.supabase.auth.signOut();
    this.session.set(null);
  }

  isAdmin(): boolean {
    return this.session()?.role === 'admin';
  }

  async accessToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  private async init(): Promise<AccountSession | null> {
    const { data } = await this.supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      this.session.set(null);
      return null;
    }
    const account = await this.loadAccount(user);
    this.session.set(account);
    return account;
  }

  private handleAuthResult(
    user: User | null,
    error: AuthError | null,
    fallbackName?: string,
    fallbackEmail?: string
  ): Promise<AccountSession> {
    if (error) throw error;
    if (!user) {
      throw new Error('Confirme o email para terminar o registo.');
    }
    return this.loadAccount(user, fallbackName, fallbackEmail);
  }

  private handleRegisterResult(
    user: User | null,
    authSession: Session | null,
    error: AuthError | null,
    fallbackName: string,
    fallbackEmail: string
  ): Promise<AccountSession> {
    if (error) throw error;
    if (!user) {
      throw new Error('Não foi possível criar a conta. Tente novamente.');
    }
    if (!authSession) {
      throw new Error('Conta criada. Confirme o email para terminar o registo e depois entre na sua conta.');
    }
    return this.loadAccount(user, fallbackName, fallbackEmail);
  }

  private async loadAccount(user: User, fallbackName?: string, fallbackEmail?: string): Promise<AccountSession> {
    let profile = await this.fetchProfileWithRetry(user.id);
    if (!profile) {
      profile = await this.ensureUserProfile(user, fallbackName, fallbackEmail);
    }
    if (!profile) {
      throw new Error('Não foi possível preparar a sua conta. Tente novamente dentro de alguns segundos.');
    }

    return {
      id: user.id,
      role: profile.role || 'user',
      name: profile.name || fallbackName || this.metadataName(user) || user.email || 'Cliente',
      email: profile.email || fallbackEmail || user.email || '',
      username: null
    };
  }

  private async fetchProfileWithRetry(userId: string): Promise<ProfileRow | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, role, name, email')
        .eq('id', userId)
        .maybeSingle<ProfileRow>();

      if (!error && data) return data;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 350));
    }

    return null;
  }

  private async ensureUserProfile(user: User, fallbackName?: string, fallbackEmail?: string): Promise<ProfileRow | null> {
    const cleanEmail = (fallbackEmail || user.email || '').trim().toLowerCase();
    const cleanName = (fallbackName || this.metadataName(user) || cleanEmail.split('@')[0] || 'Cliente').trim();
    const row = {
      id: user.id,
      role: 'user' as AccountRole,
      name: cleanName,
      email: cleanEmail,
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' });

    if (error) return null;
    return this.fetchProfileWithRetry(user.id);
  }

  private metadataName(user: User): string | null {
    return user.user_metadata?.['name'] || user.user_metadata?.['full_name'] || null;
  }
}

