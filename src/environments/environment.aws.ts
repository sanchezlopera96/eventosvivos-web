// Despliegue en AWS (k3s): el SPA y la API comparten dominio (el del ALB) y el
// Ingress envía /api a la API, así que se usan rutas relativas y no hace falta CORS.
const apiBaseUrl = '';

export const environment = {
  production: true,
  apiBaseUrl,
  // Rutas de la API centralizadas. Las que llevan parametro son funciones.
  api: {
    events: `${apiBaseUrl}/api/events`,
    event: (id: string) => `${apiBaseUrl}/api/events/${id}`,
    eventOccupancy: (id: string) => `${apiBaseUrl}/api/events/${id}/occupancy`,
    eventCancel: (id: string) => `${apiBaseUrl}/api/events/${id}/cancel`,
    reservations: `${apiBaseUrl}/api/reservations`,
    reservation: (id: string) => `${apiBaseUrl}/api/reservations/${id}`,
    reservationsByEmail: `${apiBaseUrl}/api/reservations/by-email`,
    reservationConfirm: (id: string) => `${apiBaseUrl}/api/reservations/${id}/confirm`,
    reservationCancel: (id: string) => `${apiBaseUrl}/api/reservations/${id}/cancel`,
    login: `${apiBaseUrl}/api/auth/login`,
  },
};
