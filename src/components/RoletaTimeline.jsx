import { useMemo } from 'react'
import { ELIMINATIONS, ELIMINATION_NOTES, ROULETTE_EXCLUDED, dateOfDay } from '../data/roleta'
import { allFoundersOf } from '../utils/tree'
import { FOUNDER_ORDER, FOUNDER_BADGES, LINEAGE_LABELS, isFounder } from '../data/founders'

const GEN_NAME = { 1: 'Veteranos', 3: 'Doutores', 4: 'Pastranos', 5: 'Caloiros' }
const genName = (g) => GEN_NAME[g] || `Geração ${g}`

/**
 * Linha do Tempo da Roleta: gráfico de sobreviventes por linhagem ao longo dos
 * dias + cronologia com marcos automáticos (fundador caído, linhagem/geração
 * extinta).
 */
export default function RoletaTimeline({ members, relationships }) {
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const { perDay, series, maxY, N, participantsN, current } = useMemo(() => {
    const excluded = new Set(ROULETTE_EXCLUDED)
    const participants = members.filter((m) => !excluded.has(m.id))
    const N = ELIMINATIONS.length

    // membros por linhagem (co-padrinhos contam nas duas)
    const lineAlive = {}
    FOUNDER_ORDER.forEach((f) => (lineAlive[f] = 0))
    const foundersOfId = new Map()
    for (const m of participants) {
      const fs = allFoundersOf(m.id, relationships).filter((f) => lineAlive[f] !== undefined)
      foundersOfId.set(m.id, fs)
      for (const f of fs) lineAlive[f]++
    }
    const genAlive = {}
    for (const m of participants) genAlive[m.generation] = (genAlive[m.generation] || 0) + 1

    const series = {}
    FOUNDER_ORDER.forEach((f) => (series[f] = [lineAlive[f]]))
    const maxY = Math.max(...FOUNDER_ORDER.map((f) => lineAlive[f]), 1)

    const perDay = []
    for (let d = 1; d <= N; d++) {
      const id = ELIMINATIONS[d - 1]
      const m = id ? byId.get(id) : null
      const ms = []
      if (m && isFounder(id)) ms.push({ type: 'founder', label: `Caiu o fundador ${m.name}`, emoji: '🏛️' })
      const fs = m ? foundersOfId.get(id) || [] : []
      for (const f of fs) {
        lineAlive[f]--
        if (lineAlive[f] === 0)
          ms.push({ type: 'lineage', label: `Linhagem ${LINEAGE_LABELS[f] || byId.get(f)?.name} extinta`, emoji: '☠️' })
      }
      if (m) {
        genAlive[m.generation]--
        if (genAlive[m.generation] === 0)
          ms.push({ type: 'gen', label: `Geração ${m.generation} (${genName(m.generation)}) extinta`, emoji: '🎓' })
      }
      FOUNDER_ORDER.forEach((f) => series[f].push(lineAlive[f]))
      perDay.push({ day: d, member: m, note: ELIMINATION_NOTES[d] || null, milestones: ms, survivors: participants.length - d })
    }
    // `lineAlive` no fim = sobreviventes atuais por linhagem
    return { perDay, series, maxY, N, participantsN: participants.length, current: { ...lineAlive } }
  }, [members, relationships, byId])

  // ── Gráfico (multi-linha por linhagem) ──
  const W = 100, H = 60
  const x = (day) => (N ? (day / N) * W : 0)
  const y = (count) => H - (count / maxY) * H
  const milestoneDays = perDay.filter((p) => p.milestones.length).map((p) => p.day)

  const timeline = [...perDay].reverse()

  return (
    <div>
      {/* Gráfico */}
      <div className="card mb-6 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-champi-text">Sobreviventes por linhagem</h2>
          <span className="text-xs text-champi-text-dim">Dia 0 → {N}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full">
          {/* marcos: linhas verticais douradas */}
          {milestoneDays.map((d) => (
            <line key={`m${d}`} x1={x(d)} y1="0" x2={x(d)} y2={H} stroke="#d4af37" strokeWidth="1"
              strokeDasharray="2 2" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />
          ))}
          {/* linhas por linhagem */}
          {FOUNDER_ORDER.map((f) => (
            <polyline key={f} fill="none" stroke={FOUNDER_BADGES[f]?.color || '#a98bff'} strokeWidth="2"
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"
              points={series[f].map((c, day) => `${x(day)},${y(c)}`).join(' ')} />
          ))}
        </svg>
        {/* legenda */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {FOUNDER_ORDER.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-xs text-champi-text-dim">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: FOUNDER_BADGES[f]?.color }} />
              {LINEAGE_LABELS[f] || byId.get(f)?.name}
              <b className="text-champi-text">{current[f] ?? 0}</b>
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-champi-text-dim">
            <span className="text-champi-gold">┊</span> marco
          </span>
        </div>
      </div>

      {/* Cronologia com marcos */}
      <h2 className="mb-3 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
        📜 Cronologia · {N} dias · {participantsN - N} vivos
      </h2>
      <ol className="relative ml-3 border-l-2 border-champi-line">
        {timeline.map(({ day, member, note, milestones, survivors }) => (
          <li key={day} className="mb-4 ml-5">
            <span className="absolute -left-[11px] mt-3 grid h-5 w-5 place-items-center rounded-full bg-champi-ink-3 text-[9px] font-bold text-champi-gold ring-2 ring-champi-line">
              {day}
            </span>

            {milestones.map((ms, i) => (
              <div key={i} className="mb-1.5 flex items-center gap-2 rounded-lg border border-champi-gold/40 bg-champi-gold/10 px-3 py-1.5 text-sm font-semibold text-champi-gold">
                <span>{ms.emoji}</span> {ms.label}
              </div>
            ))}

            <div className="card flex items-center gap-3 p-2.5">
              <Avatar member={member} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold text-champi-text">
                  {member ? member.name : '??? (por confirmar)'}
                </p>
                {member?.nickname && (
                  <p className="truncate text-xs text-champi-text-dim">“{member.nickname}”</p>
                )}
                {note && <p className="mt-0.5 text-[11px] italic text-champi-gold/70">💬 {note}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-champi-gold">Dia {day}</p>
                <p className="text-[10px] text-champi-text-dim">{survivors} vivos</p>
                {dateOfDay(day) && (
                  <p className="text-[10px] text-champi-text-dim">
                    {dateOfDay(day).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Avatar({ member }) {
  const photo = member?.photo_url
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-champi-line bg-champi-ink text-lg font-bold text-champi-gold opacity-70 grayscale">
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (member?.name || '?').charAt(0)
      )}
    </div>
  )
}
