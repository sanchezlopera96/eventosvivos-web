import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { vi } from 'vitest';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let getToken: ReturnType<typeof vi.fn>;

  function setup(token: string | null) {
    getToken = vi.fn().mockReturnValue(token);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getToken } },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('adjunta Authorization: Bearer cuando hay token', () => {
    setup('jwt-abc');

    http.get('https://api.test/api/events').subscribe();

    const req = httpMock.expectOne('https://api.test/api/events');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-abc');
    req.flush([]);
  });

  it('NO adjunta el header en la petición de login', () => {
    setup('jwt-abc');

    http.post('https://api.test/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('https://api.test/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('NO adjunta el header cuando no hay token', () => {
    setup(null);

    http.get('https://api.test/api/events').subscribe();

    const req = httpMock.expectOne('https://api.test/api/events');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
