import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { EventApiService } from '../../core/services/event-api.service';
import {
  RESERVATION_STATUS_LABELS,
  ReservationDetail,
} from '../../core/models/event.models';

type ActionState =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'confirmed'; code: string }
  | { kind: 'cancelled'; outcome: string }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-reservation-manage',
  imports: [
    RouterLink, DatePipe, FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatIconModule,
  ],
  templateUrl: './reservation-manage.html',
  styleUrl: './reservation-manage.scss',
})
export class ReservationManageComponent {
  private readonly api = inject(EventApiService);
  private readonly route = inject(ActivatedRoute);

  readonly locator = signal('');
  readonly reservation = signal<ReservationDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly action = signal<ActionState>({ kind: 'idle' });

  readonly isPending = computed(() => this.reservation()?.status === 0);
  readonly isConfirmed = computed(() => this.reservation()?.status === 1);
  readonly isCancelled = computed(() => this.reservation()?.status === 2);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.locator.set(id);
      this.search();
    }
  }

  statusLabel(status: number): string {
    return RESERVATION_STATUS_LABELS[status] ?? '';
  }
  statusClass(status: number): string {
    return ['st-pending', 'st-confirmed', 'st-cancelled'][status] ?? '';
  }

  search(): void {
    const id = this.locator().trim();
    if (!id) return;

    this.loading.set(true);
    this.loadError.set(null);
    this.reservation.set(null);
    this.action.set({ kind: 'idle' });

    this.api.getReservation(id).subscribe({
      next: (r) => {
        this.reservation.set(r);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(
          err?.status === 404
            ? 'No encontramos una reserva con ese localizador. Verifícalo e inténtalo de nuevo.'
            : 'No pudimos consultar la reserva. Inténtalo de nuevo.',
        );
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    const r = this.reservation();
    if (!r) return;
    this.action.set({ kind: 'working' });
    this.api.cancelReservation(r.id).subscribe({
      next: (res) => {
        this.action.set({ kind: 'cancelled', outcome: res.outcome });
        this.search();
      },
      error: (err) => this.action.set({
        kind: 'error',
        message: this.msg(err, 'No se pudo cancelar la reserva.'),
      }),
    });
  }

  private msg(err: unknown, fallback: string): string {
    const e = err as { error?: { detail?: string; title?: string } };
    return e?.error?.detail ?? e?.error?.title ?? fallback;
  }
}
