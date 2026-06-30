import { useMemo, useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import MemberPanel from '../components/MemberPanel'
import { badgeEmojis } from '../utils/badges'
import { founderOf } from '../utils/tree'
import { eliminationMap, ROULETTE_EXCLUDED } from '../data/roleta'
import { FOUNDER_ORDER, LINEAGE_LABELS } from '../data/founders'

export default function MembersPage() {
  const { members, relationships } = useMembers()
  const [query, setQuery] = useState('')
  const [gen, setGen] = useState('')
  const [lineage, setLineage] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const elimMap = useMemo(() => eliminationMap(), [])
  const excluded = useMemo(() => new Set(ROULETTE_EXCLUDED), [])

  const founderById = useMemo(() => {
    const o = {}
    for (const m of members) o[m.id] = founderOf(m.id, relationships)
    return o
  }, [members, relationships])

  const statusOf = (id) => (excluded.has(id) ? 'fora' : elimMap.has(id) ? 'caido' : 'vivo')

  const generations = useMemo(
    () => [...new Set(members.map((m) => m.generation).filter(Boolean))].sort((a, b) => a - b),
    [members]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members
      .filter((m) => {
        if (q && !(m.name.toLowerCase().includes(q) || (m.nickname || '').toLowerCase().includes(q)))
          return false
        if (gen && m.generation !== Number(gen)) return false
        if (lineage && founderById[m.id] !== lineage) return false
        if (status && statusOf(m.id) !== status) return false
        return true
      })
      .sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, query, gen, lineage, status, founderById])

  return (
    <div className="mx-auto h-full w-full max-w-5xl overflow-y-auto p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-champi-gold">Membros</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar…"
          className="w-56 rounded-lg border border-champi-line bg-champi-ink/70 px-3 py-2 text-sm text-champi-text placeholder:text-champi-text-dim focus:border-champi-gold/60 focus:outline-none"
        />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Select value={gen} onChange={setGen} label="Geração">
          <option value="">Todas as gerações</option>
          {generations.map((g) => (
            <option key={g} value={g}>
              Geração {g}
            </option>
          ))}
        </Select>
        <Select value={lineage} onChange={setLineage} label="Linhagem">
          <option value="">Todas as linhagens</option>
          {FOUNDER_ORDER.map((id) => (
            <option key={id} value={id}>
              {LINEAGE_LABELS[id] || byId.get(id)?.name || id}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={setStatus} label="Roleta">
          <option value="">Roleta: todos</option>
          <option value="vivo">🛡️ Vivos</option>
          <option value="caido">⚰️ Caídos</option>
          <option value="fora">Fora da roleta</option>
        </Select>
        <span className="self-center text-xs text-champi-text-dim">{filtered.length} membros</span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-champi-text-dim">Ninguém corresponde a esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const emojis = badgeEmojis(m, members, relationships, 4)
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="card p-4 text-left transition hover:border-champi-gold/60 hover:shadow-glow"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-champi-gold/70 bg-champi-ink text-lg font-bold text-champi-gold">
                    {m.photo_url ? (
                      <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (m.name || m.nickname || '?').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-champi-gold">{m.name}</p>
                    {m.nickname && (
                      <p className="truncate text-sm text-champi-text-dim">“{m.nickname}”</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="chip">Geração {m.generation}</span>
                  {emojis.length > 0 && <span className="text-base">{emojis.join(' ')}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal de perfil */}
      {selected && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <MemberPanel
              member={selected}
              members={members}
              relationships={relationships}
              showTreeActions={false}
              onSelect={setSelected}
              onClose={() => setSelected(null)}
              className="card animate-fade-in relative flex max-h-[85vh] w-[360px] max-w-[92vw] flex-col overflow-hidden shadow-glow"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Select({ value, onChange, label, children }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-champi-line bg-champi-ink-3/70 px-3 py-2 text-sm text-champi-text focus:border-champi-gold/60 focus:outline-none"
    >
      {children}
    </select>
  )
}
