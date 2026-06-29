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
  // Ruta de login centralizada en environment.api (ver environments/environment.ts).
  private readonly loginUrl = environment.api.login;

  // Estado reactivo del token (inicializado desde sessionStorage).
  private readonly token = signal<string | null>(this.readToken());

  // Solo CALCULA si la sesion es valida; no produce efectos secundarios
  // (un computed no debe escribir signals ni tocar el storage).
  readonly isAuthenticated = computed(() => {
    const t = this.token();
    if (!t) return false;
    return !this.isExpired();
  });

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.loginUrl, { username, password })
      .pipe(tap((res) => this.store(res.token, res.expiresAt)));
  }

  logout(): void {
    this.clear();
  }

  getToken(): string | null {
    // Si el token guardado ya expiro, se limpia aqui (fuera del computed).
    if (this.token() && this.isExpired()) {
      this.clear();
    }
    return this.token();
  }

  private isExpired(): boolean {
    const expires = sessionStorage.getItem(EXPIRES_KEY);
    return !!expires && new Date(expires).getTime() < Date.now();
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
