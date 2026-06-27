import { Component, computed, inject, signal } from '@angular/core';
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

import { EventApiService, EventFilters } from '../../core/services/event-api.service';
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  EventListItem,
  VENUES,
} from '../../core/models/event.models';

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

  readonly events = signal<EventListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Filtros (RF-02)
  readonly filterType = signal<number | null>(null);
  readonly filterVenue = signal<number | null>(null);
  readonly filterTitle = signal('');

  readonly typeOptions = [
    { value: 0, label: 'Conferencia' },
    { value: 1, label: 'Taller' },
    { value: 2, label: 'Concierto' },
  ];
  readonly venueOptions = Object.entries(VENUES).map(([id, name]) => ({
    value: Number(id), label: name,
  }));

  readonly hasEvents = computed(() => this.events().length > 0);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: EventFilters = {};
    if (this.filterType() != null) filters.type = this.filterType()!;
    if (this.filterVenue() != null) filters.venueId = this.filterVenue()!;
    if (this.filterTitle().trim()) filters.title = this.filterTitle().trim();

    this.api.listEvents(filters).subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los eventos. Revisa tu conexión e inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.filterType.set(null);
    this.filterVenue.set(null);
    this.filterTitle.set('');
    this.load();
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
