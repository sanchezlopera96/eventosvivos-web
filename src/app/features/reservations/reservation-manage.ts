import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { EventApiService } from '../../core/services/event-api.service';
import {
  RESERVATION_STATUS_LABELS,
  ReservationListItem,
} from '../../core/models/event.models';

@Component({
  selector: 'app-reservation-manage',
  imports: [
    RouterLink, DatePipe, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatIconModule,
  ],
  templateUrl: './reservation-manage.html',
  styleUrl: './reservation-manage.scss',
})
export class ReservationManageComponent implements OnInit {
  private readonly api = inject(EventApiService);
  private readonly route = inject(ActivatedRoute);

  readonly emailCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  readonly reservations = signal<ReservationListItem[] | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  // Estado por reserva (id -> mensaje de resultado de cancelar).
  readonly cancellingId = signal<string | null>(null);
  readonly rowMsg = signal<Record<string, string>>({});

  statusLabel(status: number): string {
    return RESERVATION_STATUS_LABELS[status] ?? '';
  }
  statusClass(status: number): string {
    return ['st-pending', 'st-confirmed', 'st-cancelled'][status] ?? '';
  }

  ngOnInit(): void {
    // Si llega un correo por query param (p. ej. tras crear una reserva),
    // lo precarga y busca automaticamente.
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.emailCtrl.setValue(email);
      this.search();
    }
  }

  search(): void {
    if (this.emailCtrl.invalid) {
      this.emailCtrl.markAsTouched();
      return;
    }
    const email = this.emailCtrl.value.trim();

    this.loading.set(true);
    this.loadError.set(null);
    this.reservations.set(null);
    this.rowMsg.set({});

    this.api.searchReservationsByEmail(email).subscribe({
      next: (list) => {
        this.reservations.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No pudimos consultar tus reservas. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  canCancel(r: ReservationListItem): boolean {
    // Cancelable mientras no este ya cancelada (estado 2).
    return r.status !== 2;
  }

  cancel(r: ReservationListItem): void {
    this.cancellingId.set(r.id);
    this.setRowMsg(r.id, '');

    this.api.cancelReservation(r.id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.search(); // refresca la lista para reflejar el nuevo estado
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.setRowMsg(r.id, this.msg(err, 'No se pudo cancelar.'));
      },
    });
  }

  private setRowMsg(id: string, text: string): void {
    this.rowMsg.update((m) => ({ ...m, [id]: text }));
  }

  private msg(err: unknown, fallback: string): string {
    const e = err as { error?: { detail?: string; title?: string } };
    return e?.error?.detail ?? e?.error?.title ?? fallback;
  }
}
