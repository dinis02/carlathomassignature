import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export type AccountRole = 'admin' | 'user';

export interface AccountSession {
  id: number;
  role: AccountRole;
  name: string;
  email: string;
  username?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';
  private storageKey = 'carla-thomas-session';

  session = signal<AccountSession | null>(this.loadSession());

  login(login: string, password: string): Observable<AccountSession> {
    return this.http.post<AccountSession>(`${this.apiUrl}/auth/login`, { login, password }).pipe(
      tap(session => this.setSession(session))
    );
  }

  register(name: string, email: string, password: string): Observable<AccountSession> {
    return this.http.post<AccountSession>(`${this.apiUrl}/auth/register`, { name, email, password }).pipe(
      tap(session => this.setSession(session))
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.session.set(null);
  }

  isAdmin(): boolean {
    return this.session()?.role === 'admin';
  }

  private setSession(session: AccountSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.session.set(session);
  }

  private loadSession(): AccountSession | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as AccountSession : null;
    } catch {
      return null;
    }
  }
}

