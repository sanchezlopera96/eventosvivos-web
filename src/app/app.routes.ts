import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/events/events-list').then((m) => m.EventsListComponent),
    title: 'EventosVivos — Eventos',
  },
  // La ruta de detalle se añade en la siguiente feature:
  // {
  //   path: 'events/:id',
  //   loadComponent: () =>
  //     import('./features/events/event-detail').then((m) => m.EventDetailComponent),
  // },
  { path: '**', redirectTo: '' },
];
