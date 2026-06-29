import { useMemo, useState } from 'react'
import { computeStats, buildAdjacency, degreesOfSeparation } from '../utils/tree'

/**
 * Painel de estatísticas + calculadora de grau de separação.
 * Props: members, relationships, onSelect(member)
 */
export default function Stats({ members, relationships, onSelect, allSecondaryOn = false, onToggleAllSecondary }) {
  const stats = useMemo(() => computeStats(members, relationships), [members, relationships])
  const adj = useMemo(() => buildAdjacency(members, relationships), [members, relationships])

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showFounders, setShowFounders] = useState(false)

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
        <Stat
          label="Maior Descendência"
          value={stats.topFounderCount}
          sub={stats.topFounder}
          onClick={() => setShowFounders((v) => !v)}
          active={showFounders}
        />
      </div>

      {/* Comparação da descendência dos fundadores */}
      {showFounders && stats.foundersRanking.length > 0 && (
        <div className="mt-3 rounded-lg bg-champi-ink-3/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
            Descendência por fundador
          </p>
          <div className="flex flex-col gap-2">
            {stats.foundersRanking.map((f) => {
              const max = stats.foundersRanking[0].count || 1
              const pct = Math.round((f.count / max) * 100)
              return (
                <button key={f.id} onClick={() => onSelect(byId(f.id))} className="group text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-champi-text group-hover:text-champi-gold">{f.name}</span>
                    <span className="font-semibold text-champi-gold-soft">{f.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-champi-ink">
                    <div
                      className="h-full rounded-full bg-champi-gold/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

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
                    {byId(id)?.name}
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

      {/* Mostrar/esconder TODAS as linhas de 2.º padrinho de uma vez */}
      {onToggleAllSecondary && (
        <div className="mt-4 border-t border-champi-line pt-3">
          <button
            onClick={onToggleAllSecondary}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              allSecondaryOn
                ? 'border-champi-gold bg-champi-gold/15 text-champi-gold'
                : 'border-champi-gold/50 text-champi-gold hover:bg-champi-gold/10'
            }`}
          >
            <span className="text-base leading-none">{allSecondaryOn ? '✓' : '＋'}</span>
            {allSecondaryOn ? 'Esconder todos os 2.os padrinhos' : 'Mostrar todos os 2.os padrinhos'}
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub, onClick, active }) {
  const clickable = !!onClick
  return (
    <div
      onClick={onClick}
      className={`rounded-lg bg-champi-ink-3/50 p-2.5 ${
        clickable ? 'cursor-pointer transition hover:bg-champi-ink-3/80' : ''
      } ${active ? 'ring-1 ring-champi-gold/60' : ''}`}
    >
      <p className="text-2xl font-bold text-champi-text">{value}</p>
      <p className="flex items-center gap-1 text-xs text-champi-text-dim">
        {label}
        {clickable && <span className="text-[9px] text-champi-gold-soft">{active ? '▲' : '▼'}</span>}
      </p>
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
          {m.name}
          {m.nickname ? ` · ${m.nickname}` : ''}
        </option>
      ))}
    </select>
  )
}
