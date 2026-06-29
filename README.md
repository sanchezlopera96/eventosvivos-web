# EventosVivos · Web (SPA)

Aplicación web (_Single Page Application_) para EventosVivos: catálogo de eventos culturales, reserva y gestión de entradas, y panel de administración con reportes. Es el frontend de la prueba técnica EventosVivos (.NET + Angular) y consume la [API REST de EventosVivos](https://github.com/sanchezlopera96/eventosvivos-api).

## Enlaces de producción

| Recurso | URL |
|---------|-----|
| **Frontend (esta app)** | https://nice-tree-0da071c10.7.azurestaticapps.net |
| **API (base)** | https://eventosvivos-api-ceiba-bse2accpaub5htgs.centralus-01.azurewebsites.net |
| **Swagger / OpenAPI** | https://eventosvivos-api-ceiba-bse2accpaub5htgs.centralus-01.azurewebsites.net/swagger/index.html |
| **Repositorio del backend** | https://github.com/sanchezlopera96/eventosvivos-api |

---

## Tabla de contenido

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Funcionalidades](#funcionalidades)
- [Arquitectura del frontend](#arquitectura-del-frontend)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Requisitos](#requisitos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Conexión con la API](#conexión-con-la-api)
- [Build de producción](#build-de-producción)
- [Pruebas automatizadas](#pruebas-automatizadas)
- [Acceso de administración](#acceso-de-administración)
- [Despliegue (Azure Static Web Apps)](#despliegue-azure-static-web-apps)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Autor](#autor)
- [Licencia](#licencia)

---

## Descripción

EventosVivos Web es la interfaz de usuario del sistema de reserva de entradas. Permite al **público** explorar el catálogo de eventos, ver su detalle y disponibilidad, reservar entradas y gestionar (consultar y cancelar) sus reservas a partir de su correo. Al **administrador** le ofrece un panel autenticado para crear, editar y cancelar eventos, confirmar pagos pendientes y consultar reportes de ocupación e ingresos con gráficos.

La aplicación es una SPA en Angular que consume la API REST de EventosVivos. Toda la lógica de negocio (control de aforo, reglas de calendario, penalizaciones) vive en el backend; el frontend se concentra en una experiencia de uso clara, validación de formularios y presentación de la información.

## Tecnologías

- **Angular 22** (componentes _standalone_, sin NgModules)
- **TypeScript** en modo estricto
- **Signals** para estado reactivo
- **Angular Material 3** (formularios, datepicker, diálogos, iconos)
- **Reactive Forms** con validadores personalizados
- **RxJS** para la comunicación con la API
- **SCSS** con sistema de _design tokens_ propio (variables `--ev-*`)
- **Gráficos SVG propios** (gauge y barras/donut, sin librería externa)
- **Azure Static Web Apps** + **GitHub Actions** — hosting y CI/CD

## Funcionalidades

**Público**
- Catálogo de eventos con filtros (tipo, sede, estado, fechas, título).
- Detalle de evento con disponibilidad en tiempo real.
- Reserva de entradas (nombre + correo, sin necesidad de cuenta).
- Gestión de reservas: búsqueda por correo y cancelación.

**Administración** (requiere inicio de sesión)
- Login de administrador (JWT).
- Crear, **editar** y cancelar eventos (formulario reutilizable con validación).
- Confirmar pagos de reservas pendientes.
- Reporte de ocupación por evento (modal con _gauge_) y **vista global** de reporte (`/admin/reporte`) con totales, barras de ocupación por evento y _donut_ de ingresos.

## Arquitectura del frontend

Organización por **features** con una capa _core_ compartida:

- **core/** — lo transversal: autenticación (servicio, _guard_ de rutas e _interceptor_ que adjunta el JWT), modelos/DTOs que reflejan los contratos de la API, y el `EventApiService` (única puerta de entrada a la API).
- **features/** — cada área funcional con sus componentes _standalone_: `events` (listado y detalle), `reservations` (gestión), `admin` (login, panel y reporte).
- **shared/** — componentes reutilizables de presentación: `navbar`, `footer` y `gauge` (medidor circular SVG).

Las rutas usan _lazy loading_ (`loadComponent`) y las de administración están protegidas por `adminGuard`.

## Estructura de carpetas

```text
src/
├── app/
│   ├── core/
│   │   ├── auth/             # auth.service, admin.guard, auth.interceptor
│   │   ├── models/           # event.models.ts (DTOs y enums de la API)
│   │   └── services/         # event-api.service.ts
│   ├── features/
│   │   ├── events/           # events-list, event-detail
│   │   ├── reservations/     # reservation-manage
│   │   └── admin/            # admin-login, admin (panel), report/
│   ├── shared/
│   │   ├── navbar/           # barra superior + logo
│   │   ├── footer/           # pie de página
│   │   └── gauge/            # medidor circular SVG reutilizable
│   ├── app.ts                # componente raíz (shell)
│   ├── app.config.ts         # providers (router, http, animaciones, locale es-CO)
│   └── app.routes.ts         # rutas (con lazy loading y guard de admin)
├── environments/
│   ├── environment.ts        # apiBaseUrl (apunta a la API de Azure por defecto)
│   └── environment.prod.ts
├── public/                   # assets estáticos (favicon SVG, etc.)
└── main.ts
```

## Requisitos

- **Node.js 24** (LTS) — Angular 22 requiere Node ≥ 22.22.3 / 24.15 / 26
- **npm 10+**
- **Angular CLI 22** (`npm install -g @angular/cli`)

## Instalación y ejecución local

### Clonar el repositorio

```bash
git clone https://github.com/sanchezlopera96/eventosvivos-web.git
cd eventosvivos-web
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar en desarrollo

```bash
ng serve
```

La app queda en `http://localhost:4200`. Por defecto consume la **API desplegada en Azure**, así que funciona de inmediato sin levantar el backend.

## Conexión con la API

La URL de la API se configura en `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl:
    'https://eventosvivos-api-ceiba-bse2accpaub5htgs.centralus-01.azurewebsites.net',
};
```

Para desarrollar contra la **API local** (ver el [repositorio del backend](https://github.com/sanchezlopera96/eventosvivos-api)), cambia `apiBaseUrl` por el puerto que muestre `dotnet run` (por ejemplo `http://localhost:5xxx`). Recuerda que el backend debe permitir el origen `http://localhost:4200` en su configuración de CORS.

El `auth.interceptor` adjunta automáticamente el token JWT a las peticiones de administración; el `EventApiService` centraliza todas las llamadas a la API.

## Build de producción

```bash
ng build
```

El resultado se genera en `dist/eventosvivos-web/browser/`, listo para servir como sitio estático.

## Pruebas automatizadas

Las pruebas usan **Vitest** (runner por defecto de Angular 22) con el entorno de pruebas de Angular (`TestBed`) y `HttpTestingController` para las llamadas HTTP.

```bash
ng test --watch=false
```

Cobertura actual (27 pruebas):

- **EventApiService** — verifica que cada método llama a la URL y verbo correctos, con los _query params_ y el _body_ esperados (listar/ver/editar eventos, ocupación, reservas, búsqueda por correo, confirmación de pago…).
- **AuthService** — login (guarda el token), logout (limpia la sesión) y expiración del token.
- **adminGuard** — permite el acceso con sesión válida y redirige a `/admin/login` (conservando `returnUrl`) cuando no la hay.
- **authInterceptor** — adjunta `Authorization: Bearer` cuando hay token, y lo omite en el login y cuando no hay token.
- **App (shell)** — el componente raíz se crea y monta la navegación.

## Acceso de administración

La sección de administración (`/admin`) requiere iniciar sesión en `/admin/login` con las credenciales de administrador. El backend valida usuario y contraseña y emite un JWT; el frontend lo almacena y lo adjunta a las peticiones protegidas. Las rutas de administración están protegidas por `adminGuard`, que redirige al login si no hay sesión válida.

## Despliegue (Azure Static Web Apps)

- Hospedado en **Azure Static Web Apps** (plan Free), con **CI/CD por GitHub Actions**: cada push a `main` compila la app y la publica.
- El workflow instala **Node 24**, ejecuta `npm ci` y `ng build`, y despliega el contenido de `dist/eventosvivos-web/browser`.
- El dominio del sitio está autorizado en la configuración de **CORS** del backend para permitir las llamadas a la API.

## Decisiones de diseño

- **Componentes standalone + signals**: se adopta el modelo moderno de Angular (sin NgModules), con señales para el estado reactivo y _lazy loading_ por ruta.
- **Gráficos SVG propios en vez de librería**: para el reporte (gauge, barras y donut) se descartó una librería de _charts_ por incompatibilidad de versiones con Angular 22 y para evitar una dependencia pesada. Los gráficos se dibujan en SVG con las variables del tema, lo que da control total del diseño y cero dependencias.
- **Sistema de design tokens (`--ev-*`)**: paleta y tipografía centralizadas en variables CSS para mantener coherencia visual (tema verde/teal, tipografías Space Grotesk + Inter).
- **Locale es-CO**: fechas y moneda (COP) formateadas para Colombia.
- **El frontend no replica reglas de negocio**: la validación de formulario mejora la experiencia, pero la autoridad sobre el aforo y las reglas está en el backend; el frontend refleja sus respuestas (incluidos los errores 422/404/401).

## Autor

**sanchezlopera96** — [GitHub](https://github.com/sanchezlopera96)

## Licencia

Proyecto desarrollado como prueba técnica. Licencia no especificada.
