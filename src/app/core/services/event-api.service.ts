import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  createReservation(body: CreateReservationRequest): Observable<CreatedResponse> {
    return this.http.post<CreatedResponse>(`${this.base}/api/reservations`, body);
  }

  cancelReservation(reservationId: string): Observable<CancelReservationResponse> {
    return this.http.post<CancelReservationResponse>(
      `${this.base}/api/reservations/${reservationId}/cancel`, {});
  }

  // --- Administración (requieren API key) ---

  createEvent(body: CreateEventRequest, apiKey: string): Observable<CreatedResponse> {
    return this.http.post<CreatedResponse>(`${this.base}/api/events`, body, {
      headers: this.adminHeaders(apiKey),
    });
  }

  cancelEvent(eventId: string, apiKey: string): Observable<unknown> {
    return this.http.post(`${this.base}/api/events/${eventId}/cancel`, {}, {
      headers: this.adminHeaders(apiKey),
    });
  }

  confirmPayment(reservationId: string, apiKey: string): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>(
      `${this.base}/api/reservations/${reservationId}/confirm`, {},
      { headers: this.adminHeaders(apiKey) });
  }

  private adminHeaders(apiKey: string): HttpHeaders {
    return new HttpHeaders({ 'X-Api-Key': apiKey });
  }
}
