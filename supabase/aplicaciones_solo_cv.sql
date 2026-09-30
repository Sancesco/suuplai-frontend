-- Modo "solo CV": link que muestra únicamente el currículum, sin carta.
-- Correr una vez en el SQL editor de Supabase (la tabla ya existe).
alter table app_applications add column if not exists solo_cv boolean not null default false;
