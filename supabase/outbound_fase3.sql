-- Outbound Fase 3: investigador (gancho personalizado con evidencia). Correr en Supabase.
alter table outbound_prospecto
  add column if not exists gancho          text,
  add column if not exists evidencia_url   text,
  add column if not exists cita            text,
  add column if not exists confianza       text,            -- alta | media | baja
  add column if not exists afirma_cifra    boolean default false,
  add column if not exists angulo          text,            -- ventas_frio | implementacion | banca | construccion_producto | canal_tiendas
  add column if not exists asunto_sugerido text,
  add column if not exists auto_enviable   boolean default false,
  add column if not exists investigado_en  timestamptz;
