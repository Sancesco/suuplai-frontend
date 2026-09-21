-- ─────────────────────────────────────────────────────────────────────────────
-- Suuplai · Módulo de preentrevistas asíncronas
-- Pega TODO esto en el SQL Editor de Supabase (proyecto existente) y ejecútalo.
-- Es aditivo: todo lleva prefijo interview_ y no toca tus tablas actuales.
-- Idempotente: puedes correrlo de nuevo sin romper nada.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── Plantillas de entrevista ──
create table if not exists interview_templates (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  intro        text,
  quick_fields jsonb not null default '[]'::jsonb,  -- [{key,label,type,options?,required,knockout?}]
  questions    jsonb not null default '[]'::jsonb,  -- [{order,text,maxSeconds,rubric:{1,2,3}}]
  thresholds   jsonb not null default '{"call":14,"review":10}'::jsonb,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ── Invitaciones (un candidato por una plantilla) ──
create table if not exists interview_invites (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references interview_templates(id) on delete cascade,
  candidate_name text not null,
  candidate_phone text,
  token          text unique not null,                 -- aleatorio, no adivinable
  status         text not null default 'pending',      -- pending|in_progress|completed|discarded|call_scheduled
  quick_answers  jsonb not null default '{}'::jsonb,
  consent_at     timestamptz,
  invited_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index if not exists interview_invites_template_idx on interview_invites(template_id, invited_at desc);
create index if not exists interview_invites_status_idx on interview_invites(status);

-- ── Respuestas de audio ──
create table if not exists interview_answers (
  id             uuid primary key default gen_random_uuid(),
  invite_id      uuid not null references interview_invites(id) on delete cascade,
  question_order int not null,
  audio_path     text,
  mime_type      text,
  duration_sec   int,
  transcript     text,
  created_at     timestamptz not null default now(),
  unique (invite_id, question_order)
);
create index if not exists interview_answers_invite_idx on interview_answers(invite_id, question_order);

-- ── Calificaciones manuales (1–3) por pregunta ──
create table if not exists interview_scores (
  id             uuid primary key default gen_random_uuid(),
  invite_id      uuid not null references interview_invites(id) on delete cascade,
  question_order int not null,
  score          int check (score between 1 and 3),
  note           text,
  created_at     timestamptz not null default now(),
  unique (invite_id, question_order)
);

-- RLS: encendido y sin políticas → sólo accesible con service_role (que la salta).
-- Toda la app entra por API routes server-side con la service key. Nadie más lee.
alter table interview_templates enable row level security;
alter table interview_invites   enable row level security;
alter table interview_answers   enable row level security;
alter table interview_scores    enable row level security;

-- ── Bucket privado de audios ──
insert into storage.buckets (id, name, public)
values ('interview-audio', 'interview-audio', false)
on conflict (id) do nothing;

-- ── Seed: plantilla "Ventas a comisión" ──
insert into interview_templates (title, slug, intro, quick_fields, questions, thresholds)
values (
  'Ventas a comisión',
  'ventas-comision',
  'Son dos partes: unos datos rápidos y 6 preguntas que contestas con audio de hasta 2 minutos, cuando y donde quieras. No hay respuestas correctas: queremos escuchar cómo piensas y cómo vendes.',
  '[
    {"key":"expected_salary","label":"¿Cuánto esperas ganar al mes? (MXN)","type":"number","required":true},
    {"key":"commission_ok","label":"¿Aceptarías un esquema solo por comisión?","type":"select","options":["Sí","Solo con un fijo","No"],"required":true,"knockout":["No"]},
    {"key":"car","label":"¿Tienes coche?","type":"select","options":["Sí","No"],"required":true},
    {"key":"zone","label":"¿En qué zona de la ciudad vives?","type":"text","required":true},
    {"key":"availability","label":"¿Qué días y horarios tienes disponibles?","type":"text","required":true},
    {"key":"start","label":"¿Cuándo podrías empezar?","type":"select","options":["Ya","En 2 semanas","En un mes o más"],"required":true}
  ]'::jsonb,
  '[
    {"order":1,"text":"Preséntate como si me estuvieras vendiendo a ti mismo.","maxSeconds":120,"rubric":{"1":"Recita su CV","2":"Clara pero genérica","3":"Concreta y memorable, con números o un logro"}},
    {"order":2,"text":"Cuéntame de una venta que perdiste. ¿Qué pasó y qué harías distinto?","maxSeconds":120,"rubric":{"1":"Culpa al cliente o al precio","2":"Explica qué pasó","3":"Reconoce su error y qué cambió después"}},
    {"order":3,"text":"Casi toda tu experiencia es vender a Estados Unidos por teléfono. Aquí sería con dueños de marcas mexicanas de alimentos, por WhatsApp y en persona. ¿Qué crees que cambia?","maxSeconds":120,"rubric":{"1":"\"Nada, vender es vender\"","2":"Nombra alguna diferencia","3":"Entiende la relación personal, la confianza y el seguimiento en persona"}},
    {"order":4,"text":"Soy dueño de una marca de salsa, vendo 200 frascos al mes y no estoy en tiendas. Véndeme un servicio que me ayude a entrar. Puedes hacerme preguntas en voz alta y suponer mis respuestas.","maxSeconds":120,"rubric":{"1":"Vende sin preguntar","2":"Pregunta algo y vende","3":"Pregunta primero (margen, tiendas, meta) y vende según eso"}},
    {"order":5,"text":"Te digo: \"Está caro y ya tengo quien me ayude\". ¿Qué me contestas?","maxSeconds":120,"rubric":{"1":"Baja el precio o se rinde","2":"Defiende el servicio","3":"Pregunta qué resultados le ha dado su ayuda actual y habla de lo que deja de vender"}},
    {"order":6,"text":"Te doy una lista de 100 marcas y un mes. ¿Qué haces la primera semana?","maxSeconds":120,"rubric":{"1":"\"Les llamo a todas\"","2":"Plan básico","3":"Filtra, prioriza, dice cuántas contacta y cómo mide"}}
  ]'::jsonb,
  '{"call":14,"review":10}'::jsonb
)
on conflict (slug) do nothing;
