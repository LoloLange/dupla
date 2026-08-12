# Dupla — tu compañero de gastos

App de finanzas personales multimoneda (ARS / USD / EUR / BRL / CLP / UYU) para
el mercado argentino. MVP: gasto por voz → confirmación → dashboard.

## Stack

- Next.js 16 (App Router, `proxy.ts`) + TypeScript + Tailwind CSS v4
- Supabase (Postgres + RLS en modo "solo servidor"; todo acceso pasa por API
  routes con el service role)
- Auth propia: email/password (scrypt) + Google OAuth, sesión en cookie httpOnly
- Groq (Whisper para transcripción + LLM para parsear a JSON)
- Vitest para tests unitarios de `lib`
- Deploy: Vercel

## Setup

1. Crear un proyecto en [Supabase](https://supabase.com) y ejecutar las
   migraciones `supabase/migrations/*.sql` en orden (`0001_init`, ..., `0009`).
   Con la CLI:

   ```bash
   supabase db push
   # o pegar cada archivo en el SQL editor
   ```

2. Copiar `.env.example` a `.env.local` y completar:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=       # Project URL
   SUPABASE_SERVICE_ROLE_KEY=      # service role key (solo server)
   GOOGLE_CLIENT_ID=               # https://console.cloud.google.com
   GOOGLE_CLIENT_SECRET=
   GROQ_API_KEY=                   # https://console.groq.com/keys
   ```

   > La app no usa la anon key ni Supabase Auth: el cliente nunca toca Supabase
   > directamente (solo las API routes con el service role).

3. Correr:

   ```bash
   npm install
   npm run dev
   ```

## Tests

```bash
npm test    # vitest run (lib/*.test.ts)
```

## Estructura

```
app/
  (dashboard)/page.tsx      # pantalla principal (flujo de voz + dashboard)
  (dashboard)/layout.tsx    # guard de auth + shell
  (auth)/login/page.tsx     # login por email/password o Google
  api/auth/                 # login, registro, logout, google, usuario
  api/transcribe            # audio → texto (Groq Whisper)
  api/parse                 # texto → JSON {monto, moneda, categoria, ...}
  api/gastos                # CRUD movimientos (paginado) — Supabase, service role
  api/patrimonio            # saldos ARS/USD
  api/cotizacion            # cotizaciones de dólar (DolarAPI, cache 10 min)
components/
  voice/                    # botón de voz, ondas, sheet de confirmación
  dashboard/                # patrimonio, últimos gastos, filtros, import/export
hooks/                      # useVoiceRecorder, useGastos (con paginación)
lib/
  auth.ts                   # hash scrypt, sesiones por token, cookie dupla_sesion
  groq/                     # client, transcribe, parse (prompts + normalización)
  supabase/admin.ts         # cliente service role
  types.ts, utils.ts, categorias.ts, recurrencia.ts, archivos.ts
  *.test.ts                 # tests unitarios (vitest)
proxy.ts                    # guard de sesión (Next 16 middleware)
supabase/migrations/        # schema SQL numerado (0001..0009)
```

## Schema

Tablas `usuarios`, `sesiones`, `gastos`, `patrimonio` y `perfiles` con RLS de
denegación explícita ("solo servidor"). Ver `supabase/migrations/`.
