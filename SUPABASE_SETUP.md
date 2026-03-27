# Supabase Setup Seguro

## Que usa ahora el proyecto

El sitio publico, el dashboard y las reservas ya pueden leer y escribir por backend usando Railway + PHP + Supabase Postgres.

## Variables de entorno obligatorias en Railway

- `SUPABASE_DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`

## Muy importante

La conexion PostgreSQL y la contrasena de base de datos no deben ponerse en el frontend, en `config.js`, ni subirse al repositorio publico.

## URL privada del panel

`/acceso-jr-84k2.html`

## Endpoint util para validar Railway

`/api/health.php`

## Reservas

Por ahora el sitio trabaja sin pagos en linea. Las reservas se registran en base de datos y el usuario continua por WhatsApp para cerrar la venta.

## Frontend en Vercel

Si publicas el frontend en Vercel, usa el proxy definido en [vercel.json](/C:/Users/rk88g/Documents/GitHub/viajes/vercel.json) para que `/api/*` se enrute a Railway. Asi mantienes el frontend aislado y el backend fuera del navegador como origen directo.
