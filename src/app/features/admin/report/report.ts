import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { EventApiService } from '../../../core/services/event-api.service';
import { OccupancyReport, VENUES, EVENT_STATUS_LABELS } from '../../../core/models/event.models';
import { GaugeComponent } from '../../../shared/gauge/gauge';

// Paleta para los segmentos de la dona (coherente con el tema).
const DONUT_COLORS = ['#4ecca3', '#4dd0c4', '#7bd88f', '#6fe0bc', '#3fb389', '#5fae9c'];

interface DonutSegment {
  label: string;
  value: number;
  pct: number;
  color: string;
  dash: number;
  offset: number;
}

@Component({
  selector: 'app-report',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, MatIconModule, MatButtonModule, GaugeComponent],
  templateUrl: './report.html',
  styleUrl: './report.scss',
})
export class ReportComponent implements OnInit {
  private readonly api = inject(EventApiService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly reports = signal<OccupancyReport[]>([]);

  // --- Totales agregados ---
  readonly totalEvents = computed(() => this.reports().length);
  readonly totalCapacity = computed(() =>
    this.reports().reduce((s, r) => s + r.capacity, 0));
  readonly totalSold = computed(() =>
    this.reports().reduce((s, r) => s + r.ticketsSold, 0));
  readonly totalRevenue = computed(() =>
    this.reports().reduce((s, r) => s + r.totalRevenue, 0));
  readonly avgOccupancy = computed(() => {
    const cap = this.totalCapacity();
    return cap === 0 ? 0 : (this.totalSold() / cap) * 100;
  });

  // --- Barras de ocupación por evento (ordenadas desc) ---
  readonly bars = computed(() =>
    [...this.reports()]
      .sort((a, b) => b.occupancyPercentage - a.occupancyPercentage)
      .map((r) => ({
        title: r.title,
        pct: Math.round(r.occupancyPercentage),
        sold: r.ticketsSold,
        capacity: r.capacity,
        status: r.status,
      })));

  eventStatusLabel(s: number): string { return EVENT_STATUS_LABELS[s] ?? ''; }

  // --- Dona de ingresos por evento ---
  readonly donut = computed<DonutSegment[]>(() => {
    const withRevenue = this.reports().filter((r) => r.totalRevenue > 0);
    const total = withRevenue.reduce((s, r) => s + r.totalRevenue, 0);
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 60; // r=60 en el SVG
    let acc = 0;
    return withRevenue
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((r, i) => {
        const pct = (r.totalRevenue / total) * 100;
        const dash = (pct / 100) * circumference;
        const seg: DonutSegment = {
          label: r.title,
          value: r.totalRevenue,
          pct,
          color: DONUT_COLORS[i % DONUT_COLORS.length],
          dash,
          offset: -acc,
        };
        acc += dash;
        return seg;
      });
  });

  readonly donutCircumference = 2 * Math.PI * 60;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.listEvents().subscribe({
      next: (events) => {
        if (events.length === 0) {
          this.reports.set([]);
          this.loading.set(false);
          return;
        }
        // Pide la ocupación de cada evento en paralelo; si alguno falla, lo omite.
        const calls = events.map((e) =>
          this.api.getOccupancy(e.id).pipe(
            map((r) => r),
            catchError(() => of(null)),
          ));
        forkJoin(calls).subscribe({
          next: (results) => {
            this.reports.set(results.filter((r): r is OccupancyReport => r !== null));
            this.loading.set(false);
          },
          error: () => { this.error.set(true); this.loading.set(false); },
        });
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
