# Configuración de Supabase para Room

## 1. Crear la tabla en Supabase

Ve a tu panel de Supabase: https://app.supabase.com

En el **SQL Editor**, ejecuta este script:

```sql
-- Habilitar la extensión uuid-ossp (opcional, para IDs más limpios)
create extension if not exists "uuid-ossp";

-- Tabla de notas
create table if not exists public.notes (
  id text primary key,
  title text default '',
  body text default '',
  updated bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índice para ordenar por fecha de actualización
create index if not exists idx_notes_updated_at on public.notes(updated_at desc);

-- Habilitar RLS (Row Level Security)
alter table public.notes enable row level security;

-- Política: permitir lectura y escritura pública (para desarrollo con service key)
-- ⚠️ En producción, configura políticas más restrictivas según tus necesidades
create policy "Permitir todo autenticado y anónimo" on public.notes
  for all
  using (true)
  with check (true);
```

## 2. Configurar variables en la app

Edita `script.js` y reemplaza:

```javascript
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
```

Por la URL real de tu proyecto (la encuentras en Configuración → General de tu proyecto Supabase).

Y reemplaza:

```javascript
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';
```

Por tu clave pública de Supabase (anon key). No uses la service role key en el cliente.

## 3. ⚠️ Advertencia de seguridad

La clave que me proporcionaste originalmente es una **service role key** (`sb_secret_...`). Esta clave tiene permisos administrativos totales sobre tu base de datos.

**No la expongas en el código del cliente.** Opciones más seguras:

1. **Usar la anon key pública**: En Configuración → API de Supabase, copia la `Project URL` y la `public anon key`. La anon key es segura para exponer en el cliente porque RLS restringe lo que se puede hacer.

2. **Edge Function**: Crea una Edge Function en Supabase que reciba las notas y las guarde, usando la service key solo en el servidor.

3. **Variables de entorno**: Si usas un entorno de build, no subas la clave al repositorio. Usa `.env` o similar.

## 4. Cómo funciona la sincronización

- Al guardar una nota (después de dejar de escribir 800 ms), se guarda en `localStorage` y se envía a Supabase.
- Al cargar la app, se descargan las notas de Supabase y se fusionan con las locales (gana la más reciente).
- Si no configuras `SUPABASE_URL`, la app funciona normalmente solo con `localStorage`.
