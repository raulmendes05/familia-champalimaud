-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Família Champalimaud — esquema da base de dados (Supabase)     ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Executar no SQL Editor do dashboard do Supabase.

-- Extensão para gen_random_uuid (usada no auth link)
create extension if not exists "pgcrypto";

-- ── members ──────────────────────────────────────────────────────
-- `id` é um slug de texto (ex.: 'joao_dias') igual ao usado na app — assim o
-- seed dos dados reais e o código partilham as mesmas chaves.
create table if not exists public.members (
  id          text primary key,
  name        text not null,
  nickname    text,
  photo_url   text,
  course      text,
  faculty     text,                       -- código: FCT, FD, FE, FM…
  year_joined int,
  generation  int  not null default 0,
  email       text unique,
  bio         text,
  quote       text,
  auth_id     uuid references auth.users(id) on delete set null, -- liga ao login
  created_at  timestamptz not null default now()
);

-- ── relationships ────────────────────────────────────────────────
-- type: 'padrinho' | 'madrinha' (vertical) | 'irmao' (horizontal)
create table if not exists public.relationships (
  id         text primary key,
  parent_id  text not null references public.members(id) on delete cascade,
  child_id   text not null references public.members(id) on delete cascade,
  type       text not null check (type in ('padrinho', 'madrinha', 'irmao')),
  created_at timestamptz not null default now(),
  unique (parent_id, child_id, type)
);

-- ── memories ─────────────────────────────────────────────────────
create table if not exists public.memories (
  id         uuid primary key default gen_random_uuid(),
  member_id  text not null references public.members(id) on delete cascade,
  author_id  text references public.members(id) on delete set null,
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rel_parent on public.relationships(parent_id);
create index if not exists idx_rel_child  on public.relationships(child_id);
create index if not exists idx_mem_member on public.memories(member_id);

-- ── Row Level Security ───────────────────────────────────────────
alter table public.members       enable row level security;
alter table public.relationships enable row level security;
alter table public.memories      enable row level security;

-- Leitura pública (árvore visível a todos)
create policy "members_read"  on public.members       for select using (true);
create policy "rel_read"      on public.relationships for select using (true);
create policy "mem_read"      on public.memories      for select using (true);

-- Cada membro só edita o PRÓPRIO perfil (auth_id = utilizador autenticado)
create policy "members_update_own"
  on public.members for update
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- Memórias: qualquer autenticado pode escrever; só o autor pode apagar
create policy "mem_insert_auth"
  on public.memories for insert
  to authenticated
  with check (true);

create policy "mem_delete_own"
  on public.memories for delete
  using (
    author_id in (select id from public.members where auth_id = auth.uid())
  );
