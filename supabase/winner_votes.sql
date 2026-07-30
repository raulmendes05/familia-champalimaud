-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Votação do VENCEDOR da Roleta — 1 voto por membro, TRANCADO     ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Correr UMA vez no SQL Editor do Supabase.
-- O votante identifica-se escolhendo o SEU nome. Depois de votar, não muda
-- o voto nem o nome (sem políticas de update/delete para o público).

create extension if not exists "pgcrypto";

create table if not exists public.winner_votes (
  voter_id   text primary key,   -- id do membro que vota (a sua identidade)
  choice_id  text not null,      -- em quem apostou para ganhar
  created_at timestamptz not null default now()
);

alter table public.winner_votes enable row level security;

-- leitura pública (placar + saber quem já votou)
drop policy if exists "wv_read" on public.winner_votes;
create policy "wv_read" on public.winner_votes for select using (true);

-- inserir o voto. NÃO há update nem delete público → o voto fica trancado.
drop policy if exists "wv_insert" on public.winner_votes;
create policy "wv_insert" on public.winner_votes for insert with check (true);

-- limpar tudo — só admin (pelo email)
drop policy if exists "wv_admin_delete" on public.winner_votes;
create policy "wv_admin_delete" on public.winner_votes for delete
  using ((auth.jwt() ->> 'email') = 'raulmendes2005@gmail.com');
