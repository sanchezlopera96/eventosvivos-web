import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EventApiService, EventFilters } from '../../core/services/event-api.service';
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  EventListItem,
  VENUES,
} from '../../core/models/event.models';

interface ListState {
  events: EventListItem[];
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-events-list',
  imports: [
    FormsModule, RouterLink, DatePipe, CurrencyPipe,
    MatCardModule, MatButtonModule, MatSelectModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatChipsModule, MatIconModule,
  ],
  templateUrl: './events-list.html',
  styleUrl: './events-list.scss',
})
export class EventsListComponent {
  private readonly api = inject(EventApiService);

  // Filtros reactivos (RF-02): al cambiar cualquiera se vuelve a consultar.
  readonly filterType = signal<number | null>(null);
  readonly filterVenue = signal<number | null>(null);
  readonly filterTitle = signal('');

  // Permite forzar una recarga (p. ej. boton "Reintentar" tras un error).
  private readonly retryTick = signal(0);

  readonly typeOptions = [
    { value: 0, label: 'Conferencia' },
    { value: 1, label: 'Taller' },
    { value: 2, label: 'Concierto' },
  ];
  readonly venueOptions = Object.entries(VENUES).map(([id, name]) => ({
    value: Number(id), label: name,
  }));

  // El texto se debouncea (evita una peticion por tecla); los selects son
  // inmediatos. switchMap cancela la peticion anterior si llega un cambio nuevo.
  private readonly title$ = toObservable(this.filterTitle).pipe(
    debounceTime(300),
    map((t) => t.trim()),
    distinctUntilChanged(),
  );
  private readonly type$ = toObservable(this.filterType).pipe(distinctUntilChanged());
  private readonly venue$ = toObservable(this.filterVenue).pipe(distinctUntilChanged());

  private readonly state$ = combineLatest([
    this.title$.pipe(startWith('')),
    this.type$,
    this.venue$,
    toObservable(this.retryTick),
  ]).pipe(
    switchMap(([title, type, venue]: [string, number | null, number | null, number]) => {
      const filters: EventFilters = {};
      if (type != null) filters.type = type;
      if (venue != null) filters.venueId = venue;
      if (title) filters.title = title;

      return this.api.listEvents(filters).pipe(
        map((events): ListState => ({ events, loading: false, error: null })),
        startWith<ListState>({ events: [], loading: true, error: null }),
        catchError(() => of<ListState>({
          events: [],
          loading: false,
          error: 'No pudimos cargar los eventos. Revisa tu conexión e inténtalo de nuevo.',
        })),
      );
    }),
  );

  private readonly state = toSignal(this.state$, {
    initialValue: { events: [], loading: true, error: null } as ListState,
  });

  readonly events = computed(() => this.state().events);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly hasEvents = computed(() => this.events().length > 0);

  readonly hasActiveFilters = computed(() =>
    this.filterType() != null || this.filterVenue() != null || this.filterTitle().trim() !== '');

  clearFilters(): void {
    this.filterType.set(null);
    this.filterVenue.set(null);
    this.filterTitle.set('');
  }

  retry(): void {
    this.retryTick.update((n) => n + 1);
  }

  typeLabel(type: number): string {
    return EVENT_TYPE_LABELS[type] ?? 'Evento';
  }
  statusLabel(status: number): string {
    return EVENT_STATUS_LABELS[status] ?? '';
  }
  venueName(venueId: number): string {
    return VENUES[venueId] ?? `Sede ${venueId}`;
  }
  typeClass(type: number): string {
    return ['type-conferencia', 'type-taller', 'type-concierto'][type] ?? '';
  }
  soldOut(event: EventListItem): boolean {
    return event.availableSeats <= 0;
  }
}
