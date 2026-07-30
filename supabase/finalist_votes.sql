-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Votação do vencedor da Roleta — QUALQUER pessoa vota (sem login) ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Correr UMA vez no SQL Editor do Supabase.
-- Um voto por navegador (voter_key gerado no browser). Pode mudar o voto (upsert).

create extension if not exists "pgcrypto";

create table if not exists public.finalist_votes (
  voter_key  text primary key,        -- id aleatório guardado no localStorage
  member_id  text not null,           -- em quem votou
  updated_at timestamptz not null default now()
);

alter table public.finalist_votes enable row level security;

-- leitura pública (para o placar)
drop policy if exists "fv_read" on public.finalist_votes;
create policy "fv_read" on public.finalist_votes for select using (true);

-- qualquer pessoa insere/atualiza o seu voto (a voter_key é secreta do browser)
drop policy if exists "fv_insert" on public.finalist_votes;
create policy "fv_insert" on public.finalist_votes for insert with check (true);

drop policy if exists "fv_update" on public.finalist_votes;
create policy "fv_update" on public.finalist_votes for update using (true) with check (true);

-- limpar tudo — só admin
drop policy if exists "fv_admin_delete" on public.finalist_votes;
create policy "fv_admin_delete" on public.finalist_votes for delete
  using ((auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');
