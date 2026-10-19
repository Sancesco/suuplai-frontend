-- ─────────────────────────────────────────────────────────────────────────────
-- Suuplai · Módulo de firma de contratos
-- Pega TODO esto en el SQL Editor de Supabase (proyecto existente) y ejecútalo.
-- Es aditivo: todo lleva prefijo contract/signers y no toca tus tablas actuales.
-- Idempotente: puedes correrlo de nuevo sin romper nada.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── Contratos ──
create table if not exists contracts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  content       text not null,                         -- markdown/texto del contrato
  content_hash  text not null,                         -- sha256 del content al crearse
  status        text not null default 'draft',         -- draft|sent|partially_signed|completed|voided
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  pdf_url       text                                   -- ruta en bucket privado contract-pdfs
);
create index if not exists contracts_status_idx on contracts(status, created_at desc);

-- ── Firmantes (uno o más por contrato) ──
create table if not exists signers (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid not null references contracts(id) on delete cascade,
  full_name       text not null,
  email           text not null,
  role            text,                                -- ej. "SUUPLAI" / "EL PRESTADOR"
  token           text unique not null,                -- aleatorio, no adivinable (enlace de firma)
  sign_order      int not null default 1,              -- "order" es palabra reservada → sign_order
  signed_at       timestamptz,
  signature_image text,                                -- ruta del PNG en bucket contract-signatures
  ip              text,
  user_agent      text,
  created_at      timestamptz not null default now()
);
create index if not exists signers_contract_idx on signers(contract_id, sign_order);
create index if not exists signers_token_idx on signers(token);

-- ── Bitácora de eventos (audit trail) ──
create table if not exists contract_events (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  signer_id   uuid references signers(id) on delete set null,
  event_type  text not null,                           -- created|sent|viewed|signed|completed|email_sent
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists contract_events_contract_idx on contract_events(contract_id, created_at);

-- RLS: encendido y sin políticas → sólo accesible con service_role (que la salta).
-- Toda la app entra por API routes server-side. El enlace por token se valida en el servidor.
alter table contracts       enable row level security;
alter table signers         enable row level security;
alter table contract_events enable row level security;

-- ── Buckets PRIVADOS (firmas y PDFs finales tienen PII + constancia legal) ──
insert into storage.buckets (id, name, public)
values ('contract-signatures', 'contract-signatures', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('contract-pdfs', 'contract-pdfs', false)
on conflict (id) do nothing;
