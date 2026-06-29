import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-gauge',
  template: `
    <svg [attr.viewBox]="'0 0 ' + size + ' ' + size"
         [attr.width]="size" [attr.height]="size" class="gauge">
      <!-- Pista de fondo -->
      <circle [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
              fill="none" [attr.stroke-width]="stroke"
              class="track" />
      <!-- Arco de progreso -->
      <circle [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
              fill="none" [attr.stroke-width]="stroke" stroke-linecap="round"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="dashOffset()"
              [attr.transform]="'rotate(-90 ' + center + ' ' + center + ')'"
              class="progress" [class.high]="value >= 90" [class.mid]="value >= 60 && value < 90" />
      <!-- Texto central -->
      <text [attr.x]="center" [attr.y]="center" class="pct"
            text-anchor="middle" dominant-baseline="central">{{ value }}%</text>
    </svg>
  `,
  styles: [`
    .gauge { display: block; }
    .track { stroke: var(--ev-surface-2); }
    .progress {
      stroke: var(--ev-primary);
      transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .progress.mid { stroke: var(--ev-primary-soft); }
    .progress.high { stroke: var(--ev-danger); }
    .pct {
      fill: var(--ev-text);
      font-family: var(--ev-font-display);
      font-weight: 600;
      font-size: 1.05rem;
    }
  `],
})
export class GaugeComponent {
  @Input() size = 120;
  @Input() stroke = 12;

  private readonly _value = signal(0);
  @Input() set value(v: number) {
    // Asegura un rango 0..100 y entero para el texto.
    this._value.set(Math.max(0, Math.min(100, Math.round(v))));
  }
  get value(): number { return this._value(); }

  get center(): number { return this.size / 2; }
  get radius(): number { return (this.size - this.stroke) / 2; }
  get circumference(): number { return 2 * Math.PI * this.radius; }

  // El offset "vacía" el arco segun el porcentaje (0% => todo el perimetro).
  readonly dashOffset = computed(() =>
    this.circumference * (1 - this._value() / 100));
}
