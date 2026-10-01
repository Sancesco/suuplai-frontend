-- Idioma de la aplicación: 'es' (default) o 'en'. Afecta página pública, perfil fuente,
-- análisis y carta. Correr una vez en el SQL editor de Supabase.
alter table app_applications add column if not exists idioma text not null default 'es';
