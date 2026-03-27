# Supabase Setup Seguro

## Que usa ahora el proyecto

El sitio publico y el dashboard ya pueden leer y escribir por backend usando Railway + PHP + Supabase Postgres.

## Variables de entorno obligatorias en Railway

- `SUPABASE_DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`

## Muy importante

La conexion PostgreSQL y la contrasena de base de datos no deben ponerse en el frontend, en `config.js`, ni subirse al repositorio publico.

## URL privada del panel

`/acceso-jr-84k2.html`

## Para que el frontend publico muestre pagos con Stripe

Todavia falta completar el `anon key` en `assets/js/config.js` si quieres seguir usando las Edge Functions actuales de Supabase para checkout.

## Si quieres la opcion mas segura

En el siguiente paso puedo mover tambien checkout y webhook al backend de Railway para que ninguna llave de pagos viva del lado del navegador.
