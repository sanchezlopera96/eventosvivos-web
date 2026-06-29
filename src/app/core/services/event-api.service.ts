import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CancelReservationResponse,
  ConfirmPaymentResponse,
  CreateEventRequest,
  CreateReservationRequest,
  CreatedResponse,
  EventDetail,
  EventListItem,
  OccupancyReport,
  ReservationDetail,
  ReservationListItem,
  UpdateEventRequest,
} from '../models/event.models';

export interface EventFilters {
  type?: number;
  venueId?: number;
  status?: number;
  startsFrom?: string;
  startsTo?: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // --- Públicos ---

  listEvents(filters: EventFilters = {}): Observable<EventListItem[]> {
    let params = new HttpParams();
    if (filters.type != null) params = params.set('type', filters.type);
    if (filters.venueId != null) params = params.set('venueId', filters.venueId);
    if (filters.status != null) params = params.set('status', filters.status);
    if (filters.startsFrom) params = params.set('startsFrom', filters.startsFrom);
    if (filters.startsTo) params = params.set('startsTo', filters.startsTo);
    if (filters.title) params = params.set('title', filters.title);

    return this.http.get<EventListItem[]>(`${this.base}/api/events`, { params });
  }

  getEvent(id: string): Observable<EventDetail> {
    return this.http.get<EventDetail>(`${this.base}/api/events/${id}`);
  }

  getOccupancy(eventId: string): Observable<OccupancyReport> {
    return this.http.get<OccupancyReport>(`${this.base}/api/events/${eventId}/occupancy`);
  }

  getReservation(id: string): Observable<ReservationDetail> {
    return this.http.get<ReservationDetail>(`${this.base}/api/reservations/${id}`);
  }

  // Busca las reservas asociadas a un correo (publico).
  searchReservationsByEmail(email: string): Observable<ReservationListItem[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<ReservationListItem[]>(
      `${this.base}/api/reservations/by-email`, { params });
  }

  createReservation(body: CreateReservationRequest): Observable<CreatedResponse> {
    return this.http.post<CreatedResponse>(`${this.base}/api/reservations`, body);
  }

  // Cancelar es publico (el localizador es la llave).
  cancelReservation(reservationId: string): Observable<CancelReservationResponse> {
    return this.http.post<CancelReservationResponse>(
      `${this.base}/api/reservations/${reservationId}/cancel`, {});
  }

  // --- Administración (el interceptor añade el token JWT automáticamente) ---

  listReservations(status?: number): Observable<ReservationListItem[]> {
    let params = new HttpParams();
    if (status != null) params = params.set('status', status);
    return this.http.get<ReservationListItem[]>(`${this.base}/api/reservations`, { params });
  }

  createEvent(body: CreateEventRequest): Observable<CreatedResponse> {
    return this.http.post<CreatedResponse>(`${this.base}/api/events`, body);
  }

  // Edita un evento activo (solo admin). El id va en la URL.
  updateEvent(id: string, body: UpdateEventRequest): Observable<CreatedResponse> {
    return this.http.put<CreatedResponse>(`${this.base}/api/events/${id}`, body);
  }

  cancelEvent(eventId: string): Observable<unknown> {
    return this.http.post(`${this.base}/api/events/${eventId}/cancel`, {});
  }

  confirmPayment(reservationId: string): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>(
      `${this.base}/api/reservations/${reservationId}/confirm`, {});
  }
}
