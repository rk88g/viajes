# Jalisco Rutas

Sitio de venta de viajes y rutas turisticas con frontend comercial, panel privado y backend PHP listo para Railway, conectado a Supabase Postgres.

## Que ya hace

- Portada comercial responsiva.
- Catalogo de salidas cargado desde base de datos.
- Formulario de contacto guardando mensajes en tablas reales.
- Panel privado con login por sesion para editar paquetes, salidas y configuracion.
- Backend PHP que consulta y escribe directo en Supabase Postgres.
- Dockerfile para despliegue en Railway.

## Rutas principales

- `index.html`: sitio publico.
- `acceso-jr-84k2.html`: acceso privado al panel.
- `api/bootstrap.php`: datos publicos del sitio.
- `api/contact.php`: guarda mensajes.
- `api/admin/*`: login, sesion y CRUD del dashboard.

## Variables de entorno para Railway

Usa `.env.example` como referencia y configura al menos:

- `SUPABASE_DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`

## Importante

No pongas la contrasena de PostgreSQL en `config.js` ni en el frontend. Esa credencial solo va en variables de entorno del backend.

## Pagos

El frontend todavia conserva el flujo preparado para Stripe mediante las funciones de Supabase. Si quieres, en el siguiente paso lo movemos tambien al backend de Railway.
