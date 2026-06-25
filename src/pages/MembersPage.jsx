import { useMemo, useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import { FACULDADES } from '../data/mockData'

export default function MembersPage() {
  const { members } = useMembers()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) || (m.nickname || '').toLowerCase().includes(q)
        )
      : members
    return [...list].sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name))
  }, [members, query])

  return (
    <div className="mx-auto h-full w-full max-w-5xl overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-champi-gold">Membros</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar…"
          className="w-64 rounded-lg border border-champi-line bg-champi-ink/70 px-3 py-2 text-sm
            text-champi-text placeholder:text-champi-text-dim focus:border-champi-gold/60 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <article key={m.id} className="card p-4 transition hover:border-champi-gold/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-champi-gold/70 bg-champi-ink text-lg font-bold text-champi-gold">
                {(m.name || m.nickname).charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-champi-gold">{m.name}</p>
                {m.nickname && <p className="truncate text-sm text-champi-text-dim">“{m.nickname}”</p>}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-champi-text">
              <p>{m.course}</p>
              <p className="text-xs text-champi-text-dim">
                {FACULDADES[m.faculty] || m.faculty} · {m.year_joined}
              </p>
            </div>
            <span className="chip mt-3">Geração {m.generation}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
