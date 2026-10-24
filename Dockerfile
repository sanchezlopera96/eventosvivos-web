# --- Build ---
# Angular 22 requiere Node >= 24.15.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Configuración "aws": build de producción con rutas relativas a la API.
RUN npx ng build --configuration production,aws

# --- Runtime ---
# nginx sin privilegios: corre como usuario no-root y escucha en el 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/eventosvivos-web/browser /usr/share/nginx/html

EXPOSE 8080
