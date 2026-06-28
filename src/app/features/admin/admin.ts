import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { EventApiService } from '../../core/services/event-api.service';
import { VENUES } from '../../core/models/event.models';
import { OccupancyReport } from '../../core/models/event.models';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

@Component({
  selector: 'app-admin',
  imports: [
    RouterLink, CurrencyPipe, ReactiveFormsModule, FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatIconModule,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent {
  private readonly api = inject(EventApiService);
  private readonly fb = inject(FormBuilder);

  // API key del organizador (en memoria, no se persiste).
  readonly apiKey = signal('');
  readonly hasKey = computed(() => this.apiKey().trim().length > 0);

  readonly venueOptions = Object.entries(VENUES).map(([id, name]) => ({
    value: Number(id), label: name,
  }));
  readonly typeOptions = [
    { value: 0, label: 'Conferencia' },
    { value: 1, label: 'Taller' },
    { value: 2, label: 'Concierto' },
  ];

  // --- Crear evento ---
  readonly eventForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    venueId: [1, [Validators.required]],
    capacity: [50, [Validators.required, Validators.min(1)]],
    startsAt: ['', [Validators.required]],
    endsAt: ['', [Validators.required]],
    price: [50, [Validators.required, Validators.min(0.01)]],
    type: [2, [Validators.required]],
  });
  readonly createMsg = signal<Msg>(null);
  readonly creating = signal(false);

  // --- Confirmar pago ---
  readonly confirmLocator = signal('');
  readonly confirmMsg = signal<Msg>(null);
  readonly confirming = signal(false);

  // --- Reporte de ocupación ---
  readonly occEventId = signal('');
  readonly occReport = signal<OccupancyReport | null>(null);
  readonly occMsg = signal<Msg>(null);
  readonly loadingOcc = signal(false);

  createEvent(): void {
    if (!this.hasKey()) { this.createMsg.set({ kind: 'err', text: 'Ingresa la API key primero.' }); return; }
    if (this.eventForm.invalid) { this.eventForm.markAllAsTouched(); return; }

    this.creating.set(true);
    this.createMsg.set(null);
    const v = this.eventForm.getRawValue();

    this.api.createEvent({
      title: v.title.trim(),
      description: v.description.trim(),
      venueId: v.venueId,
      capacity: v.capacity,
      startsAt: new Date(v.startsAt).toISOString(),
      endsAt: new Date(v.endsAt).toISOString(),
      price: v.price,
      type: v.type,
    }, this.apiKey().trim()).subscribe({
      next: (res) => {
        this.createMsg.set({ kind: 'ok', text: `Evento creado. ID: ${res.id}` });
        this.creating.set(false);
        this.eventForm.reset({ venueId: 1, capacity: 50, price: 50, type: 2, title: '', description: '', startsAt: '', endsAt: '' });
      },
      error: (err) => {
        this.createMsg.set({ kind: 'err', text: this.msg(err, 'No se pudo crear el evento.') });
        this.creating.set(false);
      },
    });
  }

  confirmPayment(): void {
    if (!this.hasKey()) { this.confirmMsg.set({ kind: 'err', text: 'Ingresa la API key primero.' }); return; }
    const id = this.confirmLocator().trim();
    if (!id) { this.confirmMsg.set({ kind: 'err', text: 'Ingresa el localizador de la reserva.' }); return; }

    this.confirming.set(true);
    this.confirmMsg.set(null);
    this.api.confirmPayment(id, this.apiKey().trim()).subscribe({
      next: (res) => {
        this.confirmMsg.set({ kind: 'ok', text: `Pago confirmado. Código de entrada: ${res.code}` });
        this.confirming.set(false);
      },
      error: (err) => {
        this.confirmMsg.set({ kind: 'err', text: this.msg(err, 'No se pudo confirmar el pago.') });
        this.confirming.set(false);
      },
    });
  }

  loadOccupancy(): void {
    const id = this.occEventId().trim();
    if (!id) { this.occMsg.set({ kind: 'err', text: 'Ingresa el id del evento.' }); return; }

    this.loadingOcc.set(true);
    this.occMsg.set(null);
    this.occReport.set(null);
    this.api.getOccupancy(id).subscribe({
      next: (r) => {
        this.occReport.set(r);
        this.loadingOcc.set(false);
      },
      error: (err) => {
        this.occMsg.set({ kind: 'err', text: this.msg(err, 'No se pudo cargar el reporte.') });
        this.loadingOcc.set(false);
      },
    });
  }

  private msg(err: unknown, fallback: string): string {
    const e = err as { status?: number; error?: { detail?: string; title?: string } };
    if (e?.status === 401) return 'API key inválida o ausente.';
    return e?.error?.detail ?? e?.error?.title ?? fallback;
  }
}
