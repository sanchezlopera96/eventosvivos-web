const apiBaseUrl =
  // API desplegada en Azure. Para desarrollo local contra la API local,
  // cambiar por 'http://localhost:5xxx' (el puerto que muestre dotnet run).
  'https://eventosvivos-api-ceiba-bse2accpaub5htgs.centralus-01.azurewebsites.net';

export const environment = {
  production: false,
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
