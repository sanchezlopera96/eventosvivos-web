import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('arranca sin sesión cuando no hay token', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  describe('login', () => {
    it('hace POST a /api/auth/login y guarda el token al responder', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      service.login('admin', 'secret').subscribe();

      const req = httpMock.expectOne(`${base}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'secret' });

      req.flush({ token: 'jwt-abc', expiresAt: future });

      expect(service.getToken()).toBe('jwt-abc');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('limpia el token y el estado de sesión', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      service.login('admin', 'secret').subscribe();
      httpMock.expectOne(`${base}/api/auth/login`).flush({ token: 'jwt-abc', expiresAt: future });

      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('expiración', () => {
    it('considera no autenticado si la fecha de expiración ya pasó', () => {
      // Simula un token previo ya expirado en sessionStorage, antes de crear
      // el servicio, para comprobar la lectura inicial del estado.
      sessionStorage.setItem('ev_admin_token', 'jwt-old');
      sessionStorage.setItem(
        'ev_admin_expires',
        new Date(Date.now() - 1000).toISOString(),
      );

      // Nueva instancia que lee ese estado inicial.
      const expired = TestBed.runInInjectionContext(() => new AuthService());

      expect(expired.isAuthenticated()).toBe(false);
    });
  });
});
