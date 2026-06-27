import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/events/events-list').then((m) => m.EventsListComponent),
    title: 'EventosVivos — Eventos',
  },
  {
    path: 'events/:id',
    loadComponent: () =>
      import('./features/events/event-detail').then((m) => m.EventDetailComponent),
    title: 'EventosVivos — Detalle',
  },
  { path: '**', redirectTo: '' },
];
