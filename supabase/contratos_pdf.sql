-- ─────────────────────────────────────────────────────────────────────────────
-- Suuplai · Contratos — subir PDF en vez de pegar texto
-- Corre esto DESPUÉS de contratos_setup.sql. Aditivo e idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

-- El PDF original se guarda en Storage; su ruta va aquí.
alter table contracts add column if not exists source_pdf text;

-- El contenido en texto deja de ser obligatorio (ahora la fuente es el PDF).
alter table contracts alter column content drop not null;

-- Bucket privado para el PDF original (igual que firmas y PDFs finales: privado).
insert into storage.buckets (id, name, public)
values ('contract-source', 'contract-source', false)
on conflict (id) do nothing;
