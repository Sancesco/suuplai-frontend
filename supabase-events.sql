-- ───────────────────────────────────────────────────────────────────────────
-- Suuplai — analítica propia (eventos) + gestor de links
-- Pega TODO esto en Supabase → SQL Editor → New query → Run
-- ───────────────────────────────────────────────────────────────────────────

-- Eventos
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  type          text not null,            -- page_view | simulator_change | scroll_price | click_demo | click_stripe | exit | link_click
  payload       jsonb,                    -- datos del evento (ej. { perWeek, rate } o { seconds })
  session_id    text,
  src           text,                     -- link de seguimiento /r/:slug (?src=)
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  referrer      text,
  user_agent    text,
  path          text
);
create index if not exists events_type_idx on events (type);
create index if not exists events_src_idx on events (src);
create index if not exists events_created_at_idx on events (created_at desc);
create index if not exists events_session_idx on events (session_id);
alter table events enable row level security;

-- Links de seguimiento (gestor dinámico)
create table if not exists links (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  destination text not null,
  label       text,
  clicks      int not null default 0,
  created_at  timestamptz not null default now(),
  archived    boolean not null default false
);
create index if not exists links_slug_idx on links (slug);
alter table links enable row level security;

-- RLS activado y SIN políticas públicas: solo el servidor (service_role) escribe/lee.
