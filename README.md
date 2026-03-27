# Jalisco Rutas

Sitio de venta de viajes y rutas turisticas con frontend comercial, panel privado y backend PHP para Railway, conectado directo a Supabase Postgres.

## Que ya hace

- Portada comercial responsiva.
- Catalogo publico cargado desde tablas reales.
- Formulario de contacto guardado en `contact_messages`.
- Panel privado con login por sesion y CRUD para viajes, salidas y configuracion.
- Reservas creadas desde el sitio y guardadas en `bookings`.
- Flujo de seguimiento manual por WhatsApp, sin pagos en linea por ahora.
- Endpoint de salud para validar conexion del backend.

## Rutas principales

- `index.html`: sitio publico.
- `acceso-jr-84k2.html`: acceso privado al panel.
- `api/bootstrap.php`: datos publicos del sitio.
- `api/contact.php`: guarda mensajes.
- `api/bookings.php`: crea reservas.
- `api/health.php`: revisa conexion a base.
- `api/admin/*`: login, sesion y CRUD del dashboard.

## Variables de entorno para Railway

Usa `.env.example` como referencia. Solo necesitas:

- `SUPABASE_DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`

## Despliegue en Railway

1. Crea el servicio con este repositorio y el `Dockerfile` incluido.
2. Agrega las 3 variables de entorno.
3. Ejecuta la migracion SQL en tu proyecto de Supabase.
4. Publica y valida `https://tu-servicio/api/health.php`.

## Importante

No pongas la contrasena de PostgreSQL ni credenciales administrativas en el frontend.
