import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Añade la cabecera Authorization: Bearer {token} a las peticiones salientes,
 * excepto al propio login. El backend ignora el token en endpoints públicos,
 * así que es seguro adjuntarlo siempre que exista.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token && !req.url.includes('/api/auth/login')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
