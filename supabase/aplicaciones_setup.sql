-- Módulo de aplicaciones a vacantes. Correr una vez en el SQL editor de Supabase.
-- RLS encendido sin políticas → solo la service_role (server) lee/escribe.

create table if not exists app_applications (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,                 -- null hasta publicar
  empresa       text not null,
  puesto        text not null,
  persona       text,                        -- destinatario
  correo        text,
  vacante       text not null,               -- texto completo de la vacante
  analysis      jsonb,                       -- {requisitos, match_pct, veredicto, argumentos, huecos, obligatoria}
  posicionamiento text,                      -- una línea para la página pública
  carta         text,                        -- carta (HTML/markdown), editable
  cv_url        text,                        -- CV para descargar
  cv_nombre     text,
  video_url     text,
  solo_cv       boolean not null default false,  -- link que muestra solo el CV (sin carta)
  estado        text not null default 'borrador', -- borrador/enviada/abierta/leida/compartida/respondida/rechazada
  created_at    timestamptz not null default now()
);

create table if not exists app_documents (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  idioma        text,                        -- es / en
  vertical      text,
  url           text not null,
  created_at    timestamptz not null default now()
);

create table if not exists app_events (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references app_applications(id) on delete cascade,
  slug           text,
  visitor_id     text,
  tipo           text not null,              -- open/time_on_page/section_view/cv_download/demo_click/video_play/video_complete/schedule_click/chat_message
  data           jsonb,                      -- {seconds, section, demo, ...}
  ip_hash        text,                       -- solo hash, para deduplicar
  referrer       text,
  device         text,
  created_at     timestamptz not null default now()
);
create index if not exists app_events_app_idx on app_events(application_id);
create index if not exists app_events_slug_idx on app_events(slug);

create table if not exists app_chat_messages (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references app_applications(id) on delete cascade,
  slug           text,
  visitor_id     text,
  pregunta       text not null,
  respuesta      text,
  created_at     timestamptz not null default now()
);

create table if not exists app_alerts (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references app_applications(id) on delete cascade,
  tipo           text not null,              -- open/read_60s/cv_download/shared/chat
  meta           jsonb,
  sent_at        timestamptz not null default now()
);

alter table app_applications enable row level security;
alter table app_documents    enable row level security;
alter table app_events       enable row level security;
alter table app_chat_messages enable row level security;
alter table app_alerts       enable row level security;

-- Bucket público para CVs (el dueño los comparte a propósito).
insert into storage.buckets (id, name, public) values ('aplicaciones-cv', 'aplicaciones-cv', true)
on conflict (id) do nothing;
