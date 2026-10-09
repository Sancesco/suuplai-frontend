-- Módulo Outbound (búsqueda de trabajo). Correr una vez en el SQL editor de Supabase.
-- RLS encendido sin políticas → solo la service_role (server). Reusa app_applications
-- (página de CV /aplicaciones/p/<slug>) y la tabla links (/r/<slug>) para el tracking.

create table if not exists outbound_prospecto (
  id          uuid primary key default gen_random_uuid(),
  empresa     text not null,
  persona     text,
  puesto      text,
  email       text,
  sitio_web   text,
  linkedin    text,
  sector      text,
  idioma      text not null default 'es',   -- 'es' | 'en' → decide el CV default
  slug        text unique,                   -- compartido con app_applications y links
  app_id      uuid,                          -- ref app_applications.id (página de CV)
  estado      text not null default 'nuevo', -- nuevo|listo|en_secuencia|respondio|reboto|descartado|cerrado
  pausado     boolean not null default false,
  nota        text,
  created_at  timestamptz not null default now()
);
-- dedup por correo (case-insensitive), permitiendo nulos/vacíos
create unique index if not exists outbound_prospecto_email_uidx
  on outbound_prospecto (lower(email)) where email is not null and email <> '';
create index if not exists outbound_prospecto_estado_idx on outbound_prospecto (estado);

alter table outbound_prospecto enable row level security;
