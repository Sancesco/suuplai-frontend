-- Vacantes: radar de ofertas + banco de respuestas para aplicar rápido.
-- Igual que el resto de tablas del proyecto: RLS prendida SIN políticas públicas; el acceso es solo
-- por el service-role del servidor (rutas /api con x-admin-password). anon/public no leen ni escriben.

create table if not exists vacantes (
  id uuid primary key default gen_random_uuid(),
  clave text unique not null,
  titulo text not null,
  empresa text,
  ubicacion text,
  descripcion text,
  sueldo text,
  link text,
  fuente text,
  fecha_publicada date,
  puntaje int default 0,
  ingles boolean default false,
  estado text default 'nueva' check (estado in
    ('nueva','interesa','preparada','aplicada','contacto_enviado','entrevista','descartada')),
  aplicada_en timestamptz,
  contacto_nombre text,
  contacto_linkedin text,
  contacto_email text,
  cv_link text,
  respuestas jsonb,
  carta text,
  mensaje_contacto text,
  notas text,
  creada_en timestamptz default now(),
  actualizada_en timestamptz default now()
);
create index if not exists vacantes_estado_idx on vacantes (estado);
create index if not exists vacantes_puntaje_idx on vacantes (puntaje desc);
alter table vacantes enable row level security;

create table if not exists respuestas_kit (
  id uuid primary key default gen_random_uuid(),
  atajo text unique not null,
  titulo text not null,
  texto text not null,
  orden int default 0,
  actualizada_en timestamptz default now()
);
alter table respuestas_kit enable row level security;

-- Nota: el banco de respuestas se auto-siembra la primera vez que abres /outbound/vacantes/respuestas
-- (GET /api/respuestas-kit lo llena con el KIT por defecto si está vacío). No hace falta seed manual.
