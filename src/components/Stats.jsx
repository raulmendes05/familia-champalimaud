import { useMemo, useState } from 'react'
import { computeStats, buildAdjacency, degreesOfSeparation } from '../utils/tree'

/**
 * Painel de estatísticas + calculadora de grau de separação.
 * Props: members, relationships, onSelect(member)
 */
export default function Stats({ members, relationships, onSelect }) {
  const stats = useMemo(() => computeStats(members, relationships), [members, relationships])
  const adj = useMemo(() => buildAdjacency(members, relationships), [members, relationships])

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const result = useMemo(() => {
    if (!from || !to) return null
    return degreesOfSeparation(adj, from, to)
  }, [adj, from, to])

  const byId = (id) => members.find((m) => m.id === id)

  return (
    <div className="card w-[320px] p-4">
      <h3 className="font-display text-xl font-semibold text-champi-gold">Estatísticas</h3>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Membros" value={stats.total} />
        <Stat label="Gerações" value={stats.generations} />
        <Stat label="Ligações" value={stats.padrinhoLinks} sub="padrinho/madrinha" />
        <Stat label="Curso top" value={stats.topCourseCount} sub={stats.topCourse} />
      </div>

      {/* Grau de separação */}
      <div className="mt-4 border-t border-champi-line pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
          Grau de separação
        </p>
        <div className="flex gap-2">
          <Select members={members} value={from} onChange={setFrom} placeholder="De…" />
          <Select members={members} value={to} onChange={setTo} placeholder="Até…" />
        </div>

        {result && (
          <div className="mt-3 rounded-lg bg-champi-ink-3/60 p-3">
            <p className="text-sm text-champi-text">
              <span className="text-2xl font-bold text-champi-gold">{result.degree}</span>{' '}
              {result.degree === 1 ? 'grau' : 'graus'} de separação
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
              {result.path.map((id, i) => (
                <span key={id} className="flex items-center gap-1">
                  <button
                    onClick={() => onSelect(byId(id))}
                    className="rounded px-1 text-champi-purple-soft hover:text-champi-gold"
                  >
                    {byId(id)?.nickname}
                  </button>
                  {i < result.path.length - 1 && <span className="text-champi-text-dim">→</span>}
                </span>
              ))}
            </div>
          </div>
        )}
        {from && to && !result && (
          <p className="mt-2 text-sm text-champi-text-dim">Sem ligação conhecida entre os dois.</p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-champi-ink-3/50 p-2.5">
      <p className="text-2xl font-bold text-champi-text">{value}</p>
      <p className="text-xs text-champi-text-dim">{label}</p>
      {sub && <p className="truncate text-[10px] text-champi-gold-soft">{sub}</p>}
    </div>
  )
}

function Select({ members, value, onChange, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-champi-line bg-champi-ink/70 px-2 py-1.5 text-sm
        text-champi-text focus:border-champi-gold/60 focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nickname} · {m.name}
        </option>
      ))}
    </select>
  )
}
