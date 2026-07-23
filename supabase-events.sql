-- ───────────────────────────────────────────────────────────────────────────
-- Suuplai — analítica propia (eventos) + gestor de links + alertas
-- Pega TODO esto en Supabase → SQL Editor → New query → Run
-- (Es idempotente: se puede correr varias veces sin problema.)
-- ───────────────────────────────────────────────────────────────────────────

-- Eventos
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  type          text not null,
  payload       jsonb,
  session_id    text,
  src           text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  referrer      text,
  user_agent    text,
  path          text,
  city          text,
  country       text
);
create index if not exists events_type_idx on events (type);
create index if not exists events_src_idx on events (src);
create index if not exists events_created_at_idx on events (created_at desc);
create index if not exists events_session_idx on events (session_id);
alter table events enable row level security;

-- Links de seguimiento
create table if not exists links (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  destination      text not null,
  label            text,
  clicks           int not null default 0,
  notify           boolean not null default true,
  archived         boolean not null default false,
  last_click_at    timestamptz,
  last_notified_at timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists links_slug_idx on links (slug);
create index if not exists links_archived_idx on links (archived);
alter table links enable row level security;

-- ── Migración para tablas que ya existían (agrega columnas nuevas si faltan) ──
alter table events add column if not exists city text;
alter table events add column if not exists country text;
alter table links  add column if not exists notify boolean not null default true;
alter table links  add column if not exists last_click_at timestamptz;
alter table links  add column if not exists last_notified_at timestamptz;
-- Fase 2: señales de compra + operación
alter table links  add column if not exists first_click_at timestamptz;
alter table links  add column if not exists category text;
alter table links  add column if not exists notes text;

-- RLS activado y SIN políticas públicas: solo el servidor (service_role) escribe/lee.
