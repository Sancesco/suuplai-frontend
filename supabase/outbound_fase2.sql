-- Outbound Fase 2: envíos por Gmail. Correr una vez en el SQL editor de Supabase.
-- RLS encendido sin políticas → solo service_role.

-- Config (clave/valor)
create table if not exists outbound_config (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);
insert into outbound_config (clave, valor) values
  ('pausa_global', 'false'::jsonb),
  ('procesos_activos', 'false'::jsonb),
  ('rampa_desde', to_jsonb(now())),
  ('from_email', '"santiago@suups.com.mx"'::jsonb),
  ('from_nombre', '"Santiago Céspedes"'::jsonb)
on conflict (clave) do nothing;

-- Cuenta de Gmail conectada (una sola: el alias). refresh_token con acceso de service_role.
create table if not exists outbound_gmail (
  id            int primary key default 1,
  email         text,
  refresh_token text,
  access_token  text,
  expiry        timestamptz,
  scope         text,
  connected_at  timestamptz not null default now(),
  constraint outbound_gmail_single check (id = 1)
);

-- Plantilla versionada (la activa es la que se usa)
create table if not exists outbound_plantilla (
  id              uuid primary key default gen_random_uuid(),
  version         int not null,
  asunto          text not null,
  cuerpo          text not null,
  recordatorio_1  text not null default '',
  recordatorio_2  text not null default '',
  activa          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Envíos (cada toque). maduro=true a los 7 días; respondido cancela pendientes.
create table if not exists outbound_envio (
  id               uuid primary key default gen_random_uuid(),
  prospecto_id     uuid not null,
  toque            int not null default 1,
  asunto_final     text,
  cuerpo_final     text,
  enviado_en       timestamptz not null default now(),
  gmail_thread_id  text,
  gmail_message_id text,
  rebotado         boolean not null default false,
  maduro           boolean not null default false,
  respondido       boolean not null default false,
  plantilla_version int,
  created_at       timestamptz not null default now()
);
create index if not exists outbound_envio_prospecto_idx on outbound_envio (prospecto_id);
create index if not exists outbound_envio_maduro_idx on outbound_envio (maduro, enviado_en);

alter table outbound_config enable row level security;
alter table outbound_gmail enable row level security;
alter table outbound_plantilla enable row level security;
alter table outbound_envio enable row level security;

-- Plantilla de control sembrada (v1)
insert into outbound_plantilla (version, asunto, cuerpo, recordatorio_1, recordatorio_2, activa)
select 1,
$asunto$Soy la persona que {{empresa}} necesita$asunto$,
$cuerpo${{nombre}},

Perdón que te escriba así en frío, busqué tu correo porque llevo semanas queriendo entrar a un proyecto como {{empresa}} y preferí tocar la puerta directo.

Voy directo: creo que soy la persona que {{empresa}} necesita en México. Por estas razones: vendo, construyo e implemento.

Vendo. Fundé Suuplai, que empezó como un Airbnb de tiendas y hoy es una agencia que coloca marcas de alimentos y bebidas en tiendas, cafeterías y restaurantes independientes de CDMX. Abrí en frío más de 70 puntos de venta y firmé 15 marcas, y facturo 50,000 pesos mensuales, operando solo. {{gancho}}

Construyo. Estudié finanzas y no abro un Excel desde hace más de un año. Mi empresa entera corre sobre software que hice yo: CRM de tiendas y marcas, pedidos desde el celular, notas de remisión con firma y geolocalización, pipeline en vivo. Y todo el negocio lo opero por WhatsApp: pedidos, seguimiento y cobranza. Hasta este link lo hice, y me avisa cuando lo abres -> https://www.suuplai.com.mx/r/{{slug}}

Todo lo hice solo. Todavía no sé si eso habla bien de mí o de la IA.

Y ya implementé. Fundé Reshape, una consultoría de IA para pymes. Cerramos más de 5 clientes y facturamos más de 2 millones de pesos en menos de un año, en sector financiero, imprenta, construcción y retail. Rediseñamos el flujo de cotización de una imprenta y bajamos el tiempo de respuesta de días a dos horas.

¿Por qué me iría de lo mío? Suuplai funciona, pero se volvió un negocio de calle: cada cliente nuevo significa más rutas, no mejores sistemas. Lo que quiero es volver a entrar a operaciones ajenas, entenderlas y volverlas inteligentes, pero con producto detrás.

No sé si hoy tengan algo abierto en México. Dime si hay algo donde encaje.

Te paso mi CV: https://www.suuplai.com.mx/aplicaciones/p/{{slug}}

Y mi LinkedIn: https://www.linkedin.com/in/santiagocespedesc/


Santiago Céspedes
55 8549 6699$cuerpo$,
$r1${{nombre}}, te sigo el correo de la semana pasada por si se perdió en la bandeja.

¿Hay algo en {{empresa}} donde encaje? Si es no, dímelo sin problema. Y si ya cerró la posición, también me sirve saberlo.$r1$,
$r2${{nombre}}, último de mi parte para no seguir ocupándote la bandeja. Si más adelante abres algo, aquí estoy.$r2$,
true
where not exists (select 1 from outbound_plantilla);
