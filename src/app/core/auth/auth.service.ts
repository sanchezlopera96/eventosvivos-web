import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  expiresAt: string;
}

const TOKEN_KEY = 'ev_admin_token';
const EXPIRES_KEY = 'ev_admin_expires';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // Estado reactivo del token (inicializado desde sessionStorage).
  private readonly token = signal<string | null>(this.readToken());

  readonly isAuthenticated = computed(() => {
    const t = this.token();
    if (!t) return false;
    const expires = sessionStorage.getItem(EXPIRES_KEY);
    if (expires && new Date(expires).getTime() < Date.now()) {
      // Token expirado: lo limpiamos.
      this.clear();
      return false;
    }
    return true;
  });

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}/api/auth/login`, { username, password })
      .pipe(tap((res) => this.store(res.token, res.expiresAt)));
  }

  logout(): void {
    this.clear();
  }

  getToken(): string | null {
    return this.token();
  }

  private store(token: string, expiresAt: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(EXPIRES_KEY, expiresAt);
    this.token.set(token);
  }

  private clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
    this.token.set(null);
  }

  private readToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }
}
