import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, CanActivateFn } from '@angular/router';
import { vi } from 'vitest';

import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  // Ejecuta el guard dentro del contexto de inyección de Angular.
  const runGuard = (...args: Parameters<CanActivateFn>) =>
    TestBed.runInInjectionContext(() => adminGuard(...args));

  let isAuthenticated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isAuthenticated = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated } },
      ],
    });
  });

  it('permite el acceso cuando hay sesión válida', () => {
    isAuthenticated.mockReturnValue(true);

    const result = runGuard({} as any, { url: '/admin' } as any);

    expect(result).toBe(true);
  });

  it('redirige a /admin/login cuando no hay sesión', () => {
    isAuthenticated.mockReturnValue(false);

    const result = runGuard({} as any, { url: '/admin/reporte' } as any);

    expect(result instanceof UrlTree).toBe(true);
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/admin/login');
    // Conserva la URL de destino para volver tras autenticarse.
    expect(tree.queryParams['returnUrl']).toBe('/admin/reporte');
  });
});
