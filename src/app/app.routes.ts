import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';

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
  {
    path: 'reservations/manage',
    loadComponent: () =>
      import('./features/reservations/reservation-manage').then((m) => m.ReservationManageComponent),
    title: 'EventosVivos — Gestionar reserva',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/admin-login').then((m) => m.AdminLoginComponent),
    title: 'EventosVivos — Acceso',
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin').then((m) => m.AdminComponent),
    title: 'EventosVivos — Administración',
  },
  { path: '**', redirectTo: '' },
];
