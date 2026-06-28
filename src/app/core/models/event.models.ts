// Modelos del dominio, reflejan los contratos de la API (EventReservations).

export type EventType = 'Conferencia' | 'Taller' | 'Concierto';
export type EventStatus = 'Activo' | 'Cancelado' | 'Completado';
export type ReservationStatus = 'PendientePago' | 'Confirmada' | 'Cancelada';

// El backend serializa los enums como número (índice). Mapas para la UI.
export const EVENT_TYPE_LABELS: Record<number, string> = {
  0: 'Conferencia',
  1: 'Taller',
  2: 'Concierto',
};

export const EVENT_STATUS_LABELS: Record<number, string> = {
  0: 'Activo',
  1: 'Cancelado',
  2: 'Completado',
};

export const RESERVATION_STATUS_LABELS: Record<number, string> = {
  0: 'Pendiente de pago',
  1: 'Confirmada',
  2: 'Cancelada',
};

// Detalle de una reserva (del endpoint GET /reservations/{id}).
export interface ReservationDetail {
  id: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  status: number;        // 0 Pendiente, 1 Confirmada, 2 Cancelada
  code: string | null;   // EV-###### si está confirmada
  createdAt: string;
  confirmedAt: string | null;
}

// Item de la lista de reservas (del endpoint GET /reservations).
export interface ReservationListItem {
  id: string;
  eventId: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  status: number;
  code: string | null;
  createdAt: string;
}

export interface EventListItem {
  id: string;
  title: string;
  venueId: number;
  type: number;
  status: number;
  startsAt: string;   // ISO 8601 (UTC)
  endsAt: string;
  price: number;
  capacity: number;
  availableSeats: number;
}

// Detalle de un evento (incluye la descripción completa).
export interface EventDetail extends EventListItem {
  description: string;
}

export interface OccupancyReport {
  eventId: string;
  title: string;
  capacity: number;
  ticketsSold: number;
  availableSeats: number;
  occupancyPercentage: number;
  totalRevenue: number;
  status: number;
}

// --- Comandos (cuerpos de las peticiones) ---

export interface CreateEventRequest {
  title: string;
  description: string;
  venueId: number;
  capacity: number;
  startsAt: string;
  endsAt: string;
  price: number;
  type: number;
}

export interface CreateReservationRequest {
  eventId: string;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
}

// --- Respuestas ---

export interface CreatedResponse {
  id: string;
}

export interface ConfirmPaymentResponse {
  code: string;        // EV-######
}

export interface CancelReservationResponse {
  outcome: string;     // SeatsReleased | SeatsForfeited
}

// Catálogo estático de venues (sembrados en el backend), para mostrar nombres.
export const VENUES: Record<number, string> = {
  1: 'Auditorio Central (Bogotá, 200)',
  2: 'Sala Norte (Bogotá, 50)',
  3: 'Arena Sur (Medellín, 500)',
};
