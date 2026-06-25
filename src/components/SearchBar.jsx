import { useMemo, useState } from 'react'

/**
 * Pesquisa por nome/apelido + filtro por geração.
 * Props:
 *  - members
 *  - onResults(Set<id> | null)  — ids que correspondem à pesquisa (null = sem pesquisa)
 *  - onPickGeneration(Set<gen> | null) — gerações a esbater (filtro)
 *  - onSelect(member)
 */
export default function SearchBar({ members, onResults, onPickGeneration, onSelect }) {
  const [query, setQuery] = useState('')
  const [activeGens, setActiveGens] = useState(new Set()) // gerações visíveis (vazio = todas)

  const generations = useMemo(
    () => [...new Set(members.map((m) => m.generation))].sort((a, b) => a - b),
    [members]
  )

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || (m.nickname || '').toLowerCase().includes(q)
    )
  }, [query, members])

  const handleQuery = (v) => {
    setQuery(v)
    const q = v.trim().toLowerCase()
    if (!q) return onResults(null)
    const ids = new Set(
      members
        .filter(
          (m) =>
            m.name.toLowerCase().includes(q) || (m.nickname || '').toLowerCase().includes(q)
        )
        .map((m) => m.id)
    )
    onResults(ids)
  }

  const toggleGen = (g) => {
    const next = new Set(activeGens)
    next.has(g) ? next.delete(g) : next.add(g)
    setActiveGens(next)
    // gerações a ESBATER = todas menos as activas (se houver alguma activa)
    if (next.size === 0) return onPickGeneration(null)
    const dim = new Set(generations.filter((g2) => !next.has(g2)))
    onPickGeneration(dim)
  }

  return (
    <div className="card w-[320px] p-3">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder="Pesquisar nome ou apelido…"
          className="w-full rounded-lg border border-champi-line bg-champi-ink/70 py-2 pl-9 pr-3 text-sm
            text-champi-text placeholder:text-champi-text-dim focus:border-champi-gold/60 focus:outline-none"
        />
        <span className="pointer-events-none absolute left-3 top-2.5 text-champi-text-dim">⌕</span>
      </div>

      {/* Resultados rápidos */}
      {query && (
        <ul className="mt-2 max-h-44 overflow-y-auto">
          {matches.length === 0 && (
            <li className="px-1 py-2 text-sm text-champi-text-dim">Sem resultados.</li>
          )}
          {matches.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => onSelect(m)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left
                  text-sm hover:bg-champi-ink-3/70"
              >
                <span className="text-champi-text">
                  <span className="font-semibold text-champi-gold">{m.name}</span>
                  {m.nickname && <span className="text-champi-text-dim"> · {m.nickname}</span>}
                </span>
                <span className="chip">Gen {m.generation}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Filtro por geração */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
          Gerações
        </p>
        <div className="flex flex-wrap gap-1.5">
          {generations.map((g) => {
            const active = activeGens.has(g)
            return (
              <button
                key={g}
                onClick={() => toggleGen(g)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition ${
                  active
                    ? 'bg-champi-gold text-champi-ink'
                    : 'border border-champi-line text-champi-text-dim hover:border-champi-gold/60'
                }`}
              >
                Gen {g}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
