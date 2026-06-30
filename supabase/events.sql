-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Eventos Champi — tabelas, RLS e bucket de fotos               ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Correr UMA vez no SQL Editor do dashboard do Supabase.
-- Regras:
--   • Comentários e fotos: QUALQUER pessoa (sem login).
--   • Criar evento: tem de ter login; fica 'pending' até o admin aprovar.
--   • Aprovar / apagar: só o admin (pelo email).

create extension if not exists "pgcrypto";

-- ── events ───────────────────────────────────────────────────────
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  event_date       date,
  location         text,
  created_by_email text,
  status           text not null default 'pending' check (status in ('pending','approved')),
  created_at       timestamptz not null default now()
);

-- ── comentários ──────────────────────────────────────────────────
create table if not exists public.event_comments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  author_name text not null,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- ── fotos ────────────────────────────────────────────────────────
create table if not exists public.event_photos (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  author_name text,
  url         text not null,
  caption     text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_evt_status   on public.events(status);
create index if not exists idx_evt_com_event on public.event_comments(event_id);
create index if not exists idx_evt_pho_event on public.event_photos(event_id);

-- ── Row Level Security ───────────────────────────────────────────
alter table public.events         enable row level security;
alter table public.event_comments enable row level security;
alter table public.event_photos   enable row level security;

-- events: todos veem os aprovados; o admin vê também os pendentes
drop policy if exists "events_read" on public.events;
create policy "events_read" on public.events for select
  using (status = 'approved' or (auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');

-- events: criar exige login; não-admin só pode criar como 'pending'
drop policy if exists "events_insert_auth" on public.events;
create policy "events_insert_auth" on public.events for insert to authenticated
  with check (
    status = 'pending'
    or (auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com'
  );

-- events: aprovar/editar e apagar — só admin
drop policy if exists "events_admin_update" on public.events;
create policy "events_admin_update" on public.events for update
  using ((auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');

drop policy if exists "events_admin_delete" on public.events;
create policy "events_admin_delete" on public.events for delete
  using ((auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');

-- comentários: leitura pública, escrita por qualquer pessoa, apagar só admin
drop policy if exists "evt_com_read" on public.event_comments;
create policy "evt_com_read" on public.event_comments for select using (true);

drop policy if exists "evt_com_insert" on public.event_comments;
create policy "evt_com_insert" on public.event_comments for insert with check (true);

drop policy if exists "evt_com_admin_delete" on public.event_comments;
create policy "evt_com_admin_delete" on public.event_comments for delete
  using ((auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');

-- fotos: leitura pública, escrita por qualquer pessoa, apagar só admin
drop policy if exists "evt_pho_read" on public.event_photos;
create policy "evt_pho_read" on public.event_photos for select using (true);

drop policy if exists "evt_pho_insert" on public.event_photos;
create policy "evt_pho_insert" on public.event_photos for insert with check (true);

drop policy if exists "evt_pho_admin_delete" on public.event_photos;
create policy "evt_pho_admin_delete" on public.event_photos for delete
  using ((auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');

-- ── Storage: bucket público para as fotos dos eventos ────────────
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

-- leitura pública das fotos
drop policy if exists "event_photos_public_read" on storage.objects;
create policy "event_photos_public_read" on storage.objects for select
  using (bucket_id = 'event-photos');

-- upload por qualquer pessoa (sem login)
drop policy if exists "event_photos_anon_insert" on storage.objects;
create policy "event_photos_anon_insert" on storage.objects for insert
  with check (bucket_id = 'event-photos');

-- apagar ficheiros — só admin
drop policy if exists "event_photos_admin_delete" on storage.objects;
create policy "event_photos_admin_delete" on storage.objects for delete
  using (bucket_id = 'event-photos' and (auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');
