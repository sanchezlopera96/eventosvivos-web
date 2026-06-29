import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { EventApiService } from './event-api.service';
import { environment } from '../../../environments/environment';
import {
  CreateEventRequest,
  CreateReservationRequest,
} from '../models/event.models';

describe('EventApiService', () => {
  let service: EventApiService;
  let httpMock: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EventApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Garantiza que no queden peticiones sin atender.
    httpMock.verify();
  });

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('listEvents', () => {
    it('hace GET a /api/events sin parámetros cuando no hay filtros', () => {
      service.listEvents().subscribe();
      const req = httpMock.expectOne(`${base}/api/events`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('incluye los filtros como query params', () => {
      service.listEvents({ type: 2, venueId: 1, status: 0, title: 'rock' }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${base}/api/events`,
      );
      expect(req.request.params.get('type')).toBe('2');
      expect(req.request.params.get('venueId')).toBe('1');
      expect(req.request.params.get('status')).toBe('0');
      expect(req.request.params.get('title')).toBe('rock');
      req.flush([]);
    });
  });

  describe('getEvent', () => {
    it('hace GET a /api/events/{id}', () => {
      service.getEvent('abc-123').subscribe();
      const req = httpMock.expectOne(`${base}/api/events/abc-123`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getOccupancy', () => {
    it('hace GET a /api/events/{id}/occupancy', () => {
      service.getOccupancy('ev-1').subscribe();
      const req = httpMock.expectOne(`${base}/api/events/ev-1/occupancy`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('searchReservationsByEmail', () => {
    it('hace GET a /api/reservations/by-email con el email como query param', () => {
      service.searchReservationsByEmail('ana@example.com').subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${base}/api/reservations/by-email`,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('email')).toBe('ana@example.com');
      req.flush([]);
    });
  });

  describe('createReservation', () => {
    it('hace POST a /api/reservations con el body', () => {
      const body: CreateReservationRequest = {
        eventId: 'ev-1',
        quantity: 2,
        buyerName: 'Ana',
        buyerEmail: 'ana@example.com',
      };
      service.createReservation(body).subscribe();
      const req = httpMock.expectOne(`${base}/api/reservations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 'r-1' });
    });
  });

  describe('cancelReservation', () => {
    it('hace POST a /api/reservations/{id}/cancel', () => {
      service.cancelReservation('r-1').subscribe();
      const req = httpMock.expectOne(`${base}/api/reservations/r-1/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush({ outcome: 'SeatsReleased' });
    });
  });

  describe('listReservations', () => {
    it('hace GET a /api/reservations sin filtro', () => {
      service.listReservations().subscribe();
      const req = httpMock.expectOne(`${base}/api/reservations`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('incluye el estado como query param cuando se pasa', () => {
      service.listReservations(0).subscribe();
      const req = httpMock.expectOne((r) => r.url === `${base}/api/reservations`);
      expect(req.request.params.get('status')).toBe('0');
      req.flush([]);
    });
  });

  describe('createEvent', () => {
    it('hace POST a /api/events con el body', () => {
      const body: CreateEventRequest = {
        title: 'Concierto',
        description: 'Un gran concierto en vivo',
        venueId: 1,
        capacity: 100,
        startsAt: '2030-01-01T19:00:00Z',
        endsAt: '2030-01-01T21:00:00Z',
        price: 50000,
        type: 2,
      };
      service.createEvent(body).subscribe();
      const req = httpMock.expectOne(`${base}/api/events`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 'ev-9' });
    });
  });

  describe('updateEvent', () => {
    it('hace PUT a /api/events/{id} con el body', () => {
      const body: CreateEventRequest = {
        title: 'Concierto editado',
        description: 'Descripción actualizada del evento',
        venueId: 1,
        capacity: 120,
        startsAt: '2030-01-01T19:00:00Z',
        endsAt: '2030-01-01T21:00:00Z',
        price: 60000,
        type: 2,
      };
      service.updateEvent('ev-9', body).subscribe();
      const req = httpMock.expectOne(`${base}/api/events/ev-9`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 'ev-9' });
    });
  });

  describe('cancelEvent', () => {
    it('hace POST a /api/events/{id}/cancel', () => {
      service.cancelEvent('ev-9').subscribe();
      const req = httpMock.expectOne(`${base}/api/events/ev-9/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('confirmPayment', () => {
    it('hace POST a /api/reservations/{id}/confirm', () => {
      service.confirmPayment('r-1').subscribe();
      const req = httpMock.expectOne(`${base}/api/reservations/r-1/confirm`);
      expect(req.request.method).toBe('POST');
      req.flush({ code: 'EV-000123' });
    });
  });

  describe('getReservation', () => {
    it('hace GET a /api/reservations/{id}', () => {
      service.getReservation('r-1').subscribe();
      const req = httpMock.expectOne(`${base}/api/reservations/r-1`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });
});
