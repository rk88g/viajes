# Ruta GDL

Base funcional para vender viajes y rutas turísticas desde Guadalajara y la Zona Metropolitana, con catálogo editable, apartados en línea, formulario de contacto, WhatsApp y panel administrativo conectado a Supabase.

## Qué incluye

- Landing pública con enfoque comercial para vender salidas semanales.
- Catálogo de viajes y próximas salidas con cupo disponible.
- Modal de apartado con integración preparada para checkout en línea.
- Formulario de contacto conectado a Supabase.
- Dashboard administrativo para crear y editar viajes, programar salidas, cambiar cupos y precios, actualizar textos del sitio, y revisar reservas y mensajes.
- SQL inicial para Supabase con tablas, políticas RLS y datos de ejemplo.
- Edge Functions para crear sesiones de Stripe y confirmar pagos vía webhook.

## Estructura

- `index.html`: sitio público.
- `admin.html`: panel administrativo.
- `assets/js/config.js`: configuración pública del frontend.
- `supabase/migrations/20260326_init.sql`: esquema inicial.
- `supabase/functions/create-checkout-session`: crea el checkout.
- `supabase/functions/stripe-webhook`: confirma pagos y descuenta cupo.

## Configuración mínima

1. Crea un proyecto en Supabase.
2. Ejecuta el contenido de `supabase/migrations/20260326_init.sql` en el SQL Editor.
3. Crea un usuario en Supabase Auth.
4. Marca tu usuario como administrador con esta consulta:

```sql
update public.profiles
set is_admin = true
where id = 'TU_USER_ID';
```

5. Edita `assets/js/config.js` con:

- `supabaseUrl`
- `supabaseAnonKey`
- `supabaseFunctionsBaseUrl`
- datos de contacto

## Configuración de pagos

Este proyecto deja Stripe como base técnica para el checkout.

1. Instala y configura Supabase CLI en tu equipo.
2. Define estos secrets en Supabase Functions:

```bash
supabase secrets set STRIPE_SECRET_KEY=tu_llave
supabase secrets set STRIPE_WEBHOOK_SECRET=tu_webhook_secret
supabase secrets set PUBLIC_SITE_URL=https://tu-dominio.com
```

3. Despliega funciones:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

4. Configura el webhook de Stripe apuntando a:

```text
https://TU-PROYECTO.supabase.co/functions/v1/stripe-webhook
```

## Cómo publicar

Puedes subir este proyecto a tu repositorio y publicarlo como sitio estático en Cloudflare Pages, Netlify, Vercel o cualquier hosting estático. El frontend no requiere build.

## Lo siguiente que conviene definir

- tu nombre comercial final,
- logo e identidad visual,
- proveedor definitivo de pagos si prefieres Mercado Pago o Conekta en lugar de Stripe,
- chatbot que usarás,
- dominio final.

Cuando me compartas el ejemplo visual que quieres seguir, puedo adaptar esta base a ese estilo y dejarla mucho más enfocada a conversión.
