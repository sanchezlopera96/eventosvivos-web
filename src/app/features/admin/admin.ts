import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { EventApiService } from '../../core/services/event-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { GaugeComponent } from '../../shared/gauge/gauge';
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  EventListItem,
  OccupancyReport,
  RESERVATION_STATUS_LABELS,
  ReservationListItem,
  VENUES,
  VENUE_CAPACITIES,
} from '../../core/models/event.models';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

// Combina una fecha (Date) y una hora ("HH:mm") en un Date completo.
function combineDateTime(date: Date | null, time: string | null): Date | null {
  if (!date || !time) return null;
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// Redondea una hora ("HH:mm") al slot de 30 min mas cercano hacia abajo,
// para que coincida con alguna de las opciones del desplegable.
function toTimeOption(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes() < 30 ? '00' : '30';
  return `${h}:${m}`;
}

// Validador de grupo: la fecha/hora de fin debe ser posterior a la de inicio.
const endsAfterStartsValidator: ValidatorFn = (group: AbstractControl) => {
  const starts = combineDateTime(group.get('startDate')?.value, group.get('startTime')?.value);
  const ends = combineDateTime(group.get('endDate')?.value, group.get('endTime')?.value);
  if (!starts || !ends) return null;
  return ends > starts ? null : { endsBeforeStarts: true };
};

@Component({
  selector: 'app-admin',
  imports: [
    RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatIconModule,
    MatDatepickerModule, GaugeComponent,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent implements OnInit {
  private readonly api = inject(EventApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly venueOptions = Object.entries(VENUES).map(([id, name]) => ({
    value: Number(id), label: name,
  }));
  readonly typeOptions = [
    { value: 0, label: 'Conferencia' },
    { value: 1, label: 'Taller' },
    { value: 2, label: 'Concierto' },
  ];

  // --- Eventos (para el reporte de ocupación) ---
  readonly events = signal<EventListItem[]>([]);
  readonly loadingEvents = signal(false);
  readonly selectedReport = signal<OccupancyReport | null>(null);
  readonly loadingReport = signal(false);

  // --- Pagos pendientes ---
  readonly pending = signal<ReservationListItem[]>([]);
  readonly loadingPending = signal(false);
  readonly confirmingId = signal<string | null>(null);
  readonly pendingMsg = signal<Msg>(null);

  // Aforo de la sede seleccionada (limita la capacidad del evento).
  readonly maxCapacity = signal<number>(VENUE_CAPACITIES[1]);

  // --- Modal crear / editar evento ---
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly createMsg = signal<Msg>(null);
  // Si hay id => estamos editando ese evento; si es null => creando.
  readonly editingId = signal<string | null>(null);
  readonly isEditing = computed(() => this.editingId() !== null);
  // Si el evento que se edita ya tiene plazas vendidas, no se puede bajar
  // la capacidad por debajo de ese minimo (regla del backend, replicada en UI).
  readonly minCapacity = signal<number>(1);

  readonly eventForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    venueId: [1, [Validators.required]],
    capacity: [VENUE_CAPACITIES[1], [Validators.required, Validators.min(1), Validators.max(VENUE_CAPACITIES[1])]],
    startDate: [null as Date | null, [Validators.required]],
    startTime: ['19:00', [Validators.required]],
    endDate: [null as Date | null, [Validators.required]],
    endTime: ['21:00', [Validators.required]],
    price: [50000, [Validators.required, Validators.min(1)]],
    type: [2, [Validators.required]],
  }, { validators: [endsAfterStartsValidator] });

  // Opciones de hora cada 30 minutos (00:00 .. 23:30).
  readonly timeOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  // Fecha minima seleccionable: hoy.
  readonly minDate = new Date();

  ngOnInit(): void {
    this.loadEvents();
    this.loadPending();

    // Al cambiar de sede: sugiere su aforo como capacidad y limita el maximo.
    this.eventForm.controls.venueId.valueChanges.subscribe((venueId) => {
      const aforo = VENUE_CAPACITIES[venueId] ?? 1;
      this.maxCapacity.set(aforo);
      this.applyCapacityValidators();
      // Solo autocompleta el aforo al crear; al editar respeta el valor cargado.
      if (!this.isEditing()) {
        this.eventForm.controls.capacity.setValue(aforo);
      }
      this.eventForm.controls.capacity.updateValueAndValidity();
    });
  }

  // Recalcula los validadores de capacidad segun el aforo y el minimo vendido.
  private applyCapacityValidators(): void {
    this.eventForm.controls.capacity.setValidators([
      Validators.required,
      Validators.min(this.minCapacity()),
      Validators.max(this.maxCapacity()),
    ]);
    this.eventForm.controls.capacity.updateValueAndValidity({ emitEvent: false });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  // --- Labels ---
  typeLabel(t: number): string { return EVENT_TYPE_LABELS[t] ?? 'Evento'; }
  statusLabel(s: number): string { return RESERVATION_STATUS_LABELS[s] ?? ''; }
  eventStatusLabel(s: number): string { return EVENT_STATUS_LABELS[s] ?? ''; }
  venueName(v: number): string { return VENUES[v] ?? `Sede ${v}`; }
  isActive(ev: EventListItem): boolean { return ev.status === 0; }

  // --- Eventos / reporte ---
  loadEvents(): void {
    this.loadingEvents.set(true);
    this.api.listEvents().subscribe({
      next: (e) => { this.events.set(e); this.loadingEvents.set(false); },
      error: () => this.loadingEvents.set(false),
    });
  }

  selectReport(ev: EventListItem): void {
    this.loadingReport.set(true);
    this.selectedReport.set(null);
    this.api.getOccupancy(ev.id).subscribe({
      next: (r) => { this.selectedReport.set(r); this.loadingReport.set(false); },
      error: () => this.loadingReport.set(false),
    });
  }

  closeReport(): void {
    this.selectedReport.set(null);
  }

  // --- Pagos pendientes ---
  loadPending(): void {
    this.loadingPending.set(true);
    this.pendingMsg.set(null);
    this.api.listReservations(0).subscribe({   // 0 = Pendiente de pago
      next: (r) => { this.pending.set(r); this.loadingPending.set(false); },
      error: () => { this.loadingPending.set(false); },
    });
  }

  confirm(r: ReservationListItem): void {
    this.confirmingId.set(r.id);
    this.pendingMsg.set(null);
    this.api.confirmPayment(r.id).subscribe({
      next: (res) => {
        this.pendingMsg.set({ kind: 'ok', text: `Pago confirmado para ${r.buyerName}. Código: ${res.code}` });
        this.confirmingId.set(null);
        this.loadPending();
        this.loadEvents();
      },
      error: (err) => {
        this.pendingMsg.set({ kind: 'err', text: this.msg(err, 'No se pudo confirmar el pago.') });
        this.confirmingId.set(null);
      },
    });
  }

  // --- Modal crear evento ---
  openModal(): void {
    this.editingId.set(null);
    this.minCapacity.set(1);
    this.createMsg.set(null);
    this.maxCapacity.set(VENUE_CAPACITIES[1]);
    this.eventForm.reset({
      venueId: 1, capacity: VENUE_CAPACITIES[1], price: 50000, type: 2,
      title: '', description: '',
      startDate: null, startTime: '19:00', endDate: null, endTime: '21:00',
    });
    this.applyCapacityValidators();
    this.modalOpen.set(true);
  }

  // --- Modal editar evento ---
  openEditModal(ev: EventListItem): void {
    this.createMsg.set(null);
    this.editingId.set(ev.id);
    // Carga el detalle (necesitamos la descripcion completa, que la lista no trae).
    this.api.getEvent(ev.id).subscribe({
      next: (detail) => {
        const starts = new Date(detail.startsAt);
        const ends = new Date(detail.endsAt);
        const aforo = VENUE_CAPACITIES[detail.venueId] ?? detail.capacity;
        this.maxCapacity.set(aforo);
        // Plazas ya vendidas: la capacidad no puede bajar de ahi.
        const sold = detail.capacity - detail.availableSeats;
        this.minCapacity.set(Math.max(1, sold));

        this.eventForm.reset({
          title: detail.title,
          description: detail.description,
          venueId: detail.venueId,
          capacity: detail.capacity,
          startDate: starts,
          startTime: toTimeOption(starts),
          endDate: ends,
          endTime: toTimeOption(ends),
          price: detail.price,
          type: detail.type,
        });
        this.applyCapacityValidators();
        this.modalOpen.set(true);
      },
      error: (err) => {
        this.editingId.set(null);
        this.pendingMsg.set({ kind: 'err', text: this.msg(err, 'No se pudo cargar el evento.') });
      },
    });
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingId.set(null);
  }

  // Crea o edita segun el modo del modal.
  saveEvent(): void {
    if (this.eventForm.invalid) { this.eventForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.createMsg.set(null);
    const v = this.eventForm.getRawValue();

    const starts = combineDateTime(v.startDate, v.startTime);
    const ends = combineDateTime(v.endDate, v.endTime);
    if (!starts || !ends) { this.saving.set(false); return; }

    const body = {
      title: v.title.trim(),
      description: v.description.trim(),
      venueId: v.venueId,
      capacity: v.capacity,
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
      price: v.price,
      type: v.type,
    };

    const id = this.editingId();
    const request$ = id
      ? this.api.updateEvent(id, body)
      : this.api.createEvent(body);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.editingId.set(null);
        this.loadEvents();
      },
      error: (err: unknown) => {
        const fallback = id ? 'No se pudo editar el evento.' : 'No se pudo crear el evento.';
        this.createMsg.set({ kind: 'err', text: this.msg(err, fallback) });
        this.saving.set(false);
      },
    });
  }

  private msg(err: unknown, fallback: string): string {
    const e = err as { status?: number; error?: { detail?: string; title?: string } };
    if (e?.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    return e?.error?.detail ?? e?.error?.title ?? fallback;
  }
}
