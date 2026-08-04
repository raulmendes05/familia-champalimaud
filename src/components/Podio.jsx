import { useMemo } from 'react'
import { allFoundersOf } from '../utils/tree'
import { FOUNDER_BADGES, LINEAGE_LABELS } from '../data/founders'
import { ELIMINATIONS, ROULETTE_EXCLUDED } from '../data/roleta'

const PLACES = [
  { medal: '🥇', label: 'Campeão', ring: '#E7C15A', glow: 'rgba(231,193,90,.35)' },
  { medal: '🥈', label: '2.º lugar', ring: '#cfd4db', glow: 'rgba(207,212,219,.25)' },
  { medal: '🥉', label: '3.º lugar', ring: '#d0894e', glow: 'rgba(208,137,78,.28)' },
]

/**
 * Pódio Final — mostrado quando a roleta acaba (resta 1). Junta o vencedor
 * (único sobrevivente) com o 2.º e 3.º (os dois últimos eliminados).
 */
export default function Podio({ champion, members, relationships }) {
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const total = members.filter((m) => !ROULETTE_EXCLUDED.includes(m.id)).length

  // 2.º = último eliminado; 3.º = penúltimo eliminado.
  const top3 = useMemo(() => {
    const runnerUp = byId.get(ELIMINATIONS[ELIMINATIONS.length - 1])
    const third = byId.get(ELIMINATIONS[ELIMINATIONS.length - 2])
    return [champion, runnerUp, third].filter(Boolean)
  }, [champion, byId])

  const taglines = [
    `Único sobrevivente de ${total} · o último de pé 👑`,
    'Favorito das urnas até ao fim',
    'Chegou à reta final dos 3',
  ]

  return (
    <section className="mb-8">
      <div className="mb-4 border-b border-champi-line pb-2">
        <h2 className="font-display text-xl font-semibold text-champi-text">🏆 Pódio Final · Roleta Champi</h2>
        <p className="mt-1 text-xs text-champi-text-dim">Fim de temporada — os três últimos de pé.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {top3.map((m, i) => {
          const place = PLACES[i]
          const lineages = allFoundersOf(m.id, relationships).filter((f) => FOUNDER_BADGES[f])
          const isChamp = i === 0
          return (
            <div
              key={m.id}
              className={`card relative flex flex-col items-center p-4 text-center ${
                isChamp ? 'sm:-mt-2 sm:pb-6' : 'sm:mt-4'
              }`}
              style={{ borderColor: `${place.ring}88`, boxShadow: `0 0 40px ${place.glow}` }}
            >
              <div className="text-4xl" style={{ filter: `drop-shadow(0 4px 10px ${place.glow})` }}>
                {place.medal}
              </div>
              <div
                className="mt-2 grid place-items-center overflow-hidden rounded-full bg-champi-ink font-bold text-champi-gold"
                style={{
                  width: isChamp ? 104 : 84,
                  height: isChamp ? 104 : 84,
                  border: `4px solid ${place.ring}`,
                  boxShadow: `0 0 0 4px ${place.glow}`,
                  fontSize: isChamp ? 38 : 30,
                }}
              >
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (m.name || '?').charAt(0)
                )}
              </div>

              <p
                className="mt-2 text-xs font-semibold uppercase tracking-wide"
                style={{ color: place.ring }}
              >
                {place.label}
              </p>
              <p className={`font-display font-semibold text-champi-gold ${isChamp ? 'text-2xl' : 'text-lg'}`}>
                {m.name}
              </p>
              {m.nickname && <p className="text-xs italic text-champi-text-dim">“{m.nickname}”</p>}

              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {lineages.map((f) => (
                  <span
                    key={f}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      color: FOUNDER_BADGES[f].color,
                      background: `${FOUNDER_BADGES[f].color}1a`,
                      border: `1px solid ${FOUNDER_BADGES[f].color}55`,
                    }}
                  >
                    {LINEAGE_LABELS[f] || byId.get(f)?.name}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-[11px] text-champi-text-dim">{taglines[i]}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
