import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // El shell usa RouterLink / router-outlet; se provee un router vacío.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se crea el componente raíz', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renderiza la barra de navegación con la marca', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // El navbar incluye el texto de marca "EventosVivos".
    expect(compiled.textContent).toContain('EventosVivos');
  });
});
