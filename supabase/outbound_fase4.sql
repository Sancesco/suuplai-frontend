-- Outbound Fase 4: Inteligencia (bandit de asunto + agente de hipótesis). Correr en Supabase.

create table if not exists outbound_brazo (
  id          uuid primary key default gen_random_uuid(),
  perilla     text not null default 'asunto',   -- asunto | angulo | hora | sector
  texto       text not null,                     -- p.ej. el asunto (con variables {{empresa}})
  hipotesis   text,
  fundamento  text,
  es_control  boolean not null default false,
  activa      boolean not null default true,
  envios        int not null default 0,
  envios_maduros int not null default 0,
  clics         int not null default 0,          -- señal rápida (numerador del posterior)
  respuestas    int not null default 0,          -- confirmación (KPI)
  alfa        double precision not null default 1,   -- posterior Beta
  beta        double precision not null default 4,   -- prior ~20%
  created_at  timestamptz not null default now()
);
create index if not exists outbound_brazo_perilla_idx on outbound_brazo (perilla, activa);

alter table outbound_envio add column if not exists brazo_asunto uuid;
alter table outbound_envio add column if not exists brazo_hora uuid;
-- Programación del envío (franja/día elegidos). El cron manda cuando programado_en <= now.
alter table outbound_prospecto add column if not exists programado_en timestamptz;
alter table outbound_prospecto add column if not exists brazo_hora uuid;

alter table outbound_brazo enable row level security;

-- Seed: control + 2 variantes de asunto (si no hay ninguno).
insert into outbound_brazo (perilla, texto, es_control, activa)
select * from (values
  ('asunto', 'Soy la persona que {{empresa}} necesita', true, true),
  ('asunto', '{{empresa}} + alguien que vende, construye e implementa', false, true),
  ('asunto', 'Pregunta directa sobre {{empresa}} en México', false, true)
) as v(perilla, texto, es_control, activa)
where not exists (select 1 from outbound_brazo where perilla = 'asunto');

-- Seed: franjas horarias (hora local CDMX). El bandit aprende cuál recibe más clics.
insert into outbound_brazo (perilla, texto, es_control, activa)
select * from (values
  ('hora', '8-10',  false, true),
  ('hora', '10-12', true,  true),
  ('hora', '12-14', false, true),
  ('hora', '14-16', false, true),
  ('hora', '16-17', false, true)
) as v(perilla, texto, es_control, activa)
where not exists (select 1 from outbound_brazo where perilla = 'hora');
