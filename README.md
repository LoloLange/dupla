# Dupla — tu compañero de gastos

App de finanzas personales multimoneda (ARS / USD) para el mercado argentino.
MVP: gasto por voz → confirmación → dashboard.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (auth + base de datos con RLS)
- Groq (Whisper para transcripción + LLM para parsear a JSON)
- Deploy: Vercel

## Setup

1. Crear un proyecto en [Supabase](https://supabase.com) y ejecutar la migración:

   ```bash
   supabase db push
   # o pegar el contenido de supabase/migrations/0001_init.sql en el SQL editor
   ```

2. Copiar `.env.example` a `.env.local` y completar:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...      # Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=... # anon key
   GROQ_API_KEY=...                  # https://console.groq.com/keys
   ```

3. En Supabase → Authentication → URL Configuration, agregar
   `http://localhost:3000` y `https://tudominio.vercel.app` como redirect URLs.

4. Correr:

   ```bash
   npm install
   npm run dev
   ```

## Estructura

```
app/
  (dashboard)/page.tsx      # pantalla principal (flujo de voz + dashboard)
  (dashboard)/layout.tsx    # guard de auth + shell
  (auth)/login/page.tsx     # login por magic link / OTP
  api/transcribe            # audio → texto (Groq Whisper)
  api/parse                 # texto → JSON {monto, moneda, categoria, ...}
  api/gastos                # CRUD gastos (Supabase, RLS)
  api/patrimonio            # saldos ARS/USD
components/
  voice/                    # botón de voz, ondas, sheet de confirmación
  dashboard/                # patrimonio, últimos gastos
hooks/                      # useVoiceRecorder, useGastos
lib/groq/                   # client, transcribe, parse, prompts
lib/supabase/               # client browser/server
proxy.ts                    # middleware de sesión (Next 16)
supabase/migrations/        # schema SQL
```

## Schema

Tablas `gastos` y `patrimonio` con Row Level Security por usuario.
Ver `supabase/migrations/0001_init.sql`.
