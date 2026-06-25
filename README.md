# 🌳 Família Champalimaud

Árvore genealógica interativa de uma família de praxe universitária. Visualização
em D3.js, perfis de membros, pesquisa, filtros e estatísticas — com tema escuro
dourado & roxo.

## Stack

- **React + Vite** — app e build
- **D3.js** — visualização da árvore (layout, zoom, pan)
- **Tailwind CSS** — estilos (tema escuro, cores da família)
- **React Router** — navegação
- **Supabase** — base de dados + autenticação por magic link _(opcional; corre em modo demo sem ele)_

## Arrancar

> Requer **Node.js 18+** instalado (ver secção abaixo se ainda não tens).

```bash
npm install
npm run dev
```

Abre em <http://localhost:5173>. Por defeito corre com **dados mock** — não precisa
de Supabase para ver a árvore a funcionar.

## Funcionalidades (MVP)

- ✅ Árvore interativa em D3: zoom, pan, nós clicáveis, modo vertical/horizontal
- ✅ Destaque do ramo (linhagem) do membro selecionado
- ✅ Painel de perfil: apelido, curso, faculdade, citação, padrinhos/afilhados/irmãos, memórias
- ✅ Pesquisa por nome/apelido + filtro por geração
- ✅ Estatísticas: total de membros, gerações, curso mais comum, **grau de separação** entre dois membros
- ✅ Página de membros (grelha) e ecrã de login (magic link, pronto para Supabase)

## Estrutura

```
src/
├── components/
│   ├── FamilyTree.jsx   # visualização D3 (core)
│   ├── MemberPanel.jsx  # painel lateral de perfil
│   ├── SearchBar.jsx    # pesquisa + filtro por geração
│   ├── Stats.jsx        # estatísticas + grau de separação
│   └── Navbar.jsx
├── pages/               # TreePage, MembersPage, LoginPage
├── hooks/useMembers.js  # fonte de dados (mock → Supabase aqui)
├── data/mockData.js     # família de exemplo (4 gerações)
├── utils/tree.js        # hierarquia, BFS, ramo, estatísticas (puro)
└── lib/supabase.js      # cliente + auth + queries
```

## Ligar ao Supabase

1. Cria um projeto em [supabase.com](https://supabase.com).
2. SQL Editor → cola e corre [`supabase/schema.sql`](supabase/schema.sql).
3. Copia `.env.example` para `.env.local` e preenche `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Em [`src/hooks/useMembers.js`](src/hooks/useMembers.js), troca os dados mock por
   `fetchMembers()` / `fetchRelationships()` de `lib/supabase.js`. Mais nada muda —
   o resto da app já consome essa interface.

## Instalar Node.js (macOS)

Esta máquina não tinha Node. Opções:

```bash
# via Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node

# ou instalador oficial: https://nodejs.org  (LTS)
```

## Roadmap (pós-MVP)

- [ ] Edição do próprio perfil (após login)
- [ ] Exportar linhagem como PDF
- [ ] Galeria de fotos por evento
- [ ] Modo "convívio" (projeção em TV)
```
