import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { EventApiService } from '../../core/services/event-api.service';
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  EventDetail,
  VENUES,
} from '../../core/models/event.models';

type ReserveState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; reservationId: string }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-event-detail',
  imports: [
    RouterLink, DatePipe, CurrencyPipe, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatIconModule,
  ],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetailComponent {
  private readonly api = inject(EventApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly event = signal<EventDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly reserve = signal<ReserveState>({ kind: 'idle' });

  readonly form = this.fb.nonNullable.group({
    buyerName: ['', [Validators.required, Validators.minLength(3)]],
    buyerEmail: ['', [Validators.required, Validators.email]],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  readonly soldOut = computed(() => {
    const e = this.event();
    return !!e && e.availableSeats <= 0;
  });

  readonly isActive = computed(() => this.event()?.status === 0);

  readonly occupancyPct = computed(() => {
    const e = this.event();
    if (!e || e.capacity === 0) return 0;
    return Math.round(((e.capacity - e.availableSeats) / e.capacity) * 100);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Evento no encontrado.');
      this.loading.set(false);
    } else {
      this.loadEvent(id);
    }
  }

  private loadEvent(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getEvent(id).subscribe({
      next: (e) => {
        this.event.set(e);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 404
            ? 'Este evento no existe o fue retirado.'
            : 'No pudimos cargar el evento. Inténtalo de nuevo.',
        );
        this.loading.set(false);
      },
    });
  }

  submitReservation(): void {
    const e = this.event();
    if (!e || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.reserve.set({ kind: 'submitting' });
    const v = this.form.getRawValue();

    this.api.createReservation({
      eventId: e.id,
      quantity: v.quantity,
      buyerName: v.buyerName.trim(),
      buyerEmail: v.buyerEmail.trim(),
    }).subscribe({
      next: (res) => {
        this.reserve.set({ kind: 'success', reservationId: res.id });
        // Refresca cupos disponibles tras reservar.
        this.loadEvent(e.id);
      },
      error: (err) => {
        const message =
          err?.error?.detail ??
          err?.error?.title ??
          'No se pudo completar la reserva. Revisa los datos e inténtalo de nuevo.';
        this.reserve.set({ kind: 'error', message });
      },
    });
  }

  resetReservation(): void {
    this.reserve.set({ kind: 'idle' });
    this.form.reset({ buyerName: '', buyerEmail: '', quantity: 1 });
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
}
