-- ───────────────────────────────────────────────────────────────────────────
-- Suuplai — esquema de base de datos
-- Pega TODO esto en Supabase → SQL Editor → New query → Run
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists registros (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  tipo        text not null,            -- 'tienda' | 'productor'
  nombre      text,
  apellido    text,
  email       text,
  whatsapp    text,
  data        jsonb not null            -- el formulario completo
);

-- Índices para ordenar/filtrar rápido
create index if not exists registros_created_at_idx on registros (created_at desc);
create index if not exists registros_tipo_idx on registros (tipo);

-- Seguridad: RLS activado y SIN políticas públicas.
-- Así la tabla SOLO es accesible desde el servidor con la service_role key.
-- (El público nunca puede leer ni escribir directo desde el navegador.)
alter table registros enable row level security;
