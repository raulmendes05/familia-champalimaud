import { useEffect, useMemo, useState } from 'react'
import { allFoundersOf } from '../utils/tree'
import { FOUNDER_ORDER, FOUNDER_BADGES, LINEAGE_LABELS } from '../data/founders'
import { isSupabaseConfigured, fetchFinalistVotes, castFinalistVote } from '../lib/supabase'

const VKEY = 'champi_voter'
const getVoterKey = () => {
  try {
    let k = localStorage.getItem(VKEY)
    if (!k) {
      k = crypto.randomUUID()
      localStorage.setItem(VKEY, k)
    }
    return k
  } catch {
    return null
  }
}

const MEDALS = ['🥇', '🥈', '🥉']

/**
 * Pódio "Reta Final": os últimos sobreviventes com dossier (linhagens + títulos)
 * e votação no vencedor (Supabase; qualquer pessoa, um voto por navegador).
 */
export default function Finalistas({ survivors, members, relationships }) {
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const dossiers = useMemo(() => {
    const madrinhaIds = new Set(relationships.filter((r) => r.type === 'madrinha').map((r) => r.parent_id))
    const femaleSurv = survivors.filter((m) => madrinhaIds.has(m.id))
    const genCount = {}
    survivors.forEach((m) => (genCount[m.generation] = (genCount[m.generation] || 0) + 1))
    const linCount = {}
    survivors.forEach((m) => allFoundersOf(m.id, relationships).forEach((f) => (linCount[f] = (linCount[f] || 0) + 1)))
    const founderDirectAlive = {}
    FOUNDER_ORDER.forEach((f) => (founderDirectAlive[f] = []))
    for (const m of survivors)
      for (const r of relationships)
        if (
          (r.type === 'padrinho' || r.type === 'madrinha') &&
          r.child_id === m.id &&
          FOUNDER_ORDER.includes(r.parent_id)
        )
          founderDirectAlive[r.parent_id].push(m.id)

    return survivors.map((m) => {
      const lineages = allFoundersOf(m.id, relationships).filter((f) => FOUNDER_BADGES[f])
      const titles = []
      if (madrinhaIds.has(m.id) && femaleSurv.length === 1) titles.push('👑 Última mulher')
      for (const f of lineages)
        if (linCount[f] === 1) titles.push(`${FOUNDER_BADGES[f].emoji} Último ${LINEAGE_LABELS[f] || byId.get(f)?.name}`)
      if (genCount[m.generation] === 1) titles.push(`🎓 Único da Geração ${m.generation}`)
      for (const f of FOUNDER_ORDER)
        if (founderDirectAlive[f].length === 1 && founderDirectAlive[f][0] === m.id)
          titles.push(`🗼 Último afilhado direto do ${byId.get(f)?.name}`)
      return { m, lineages, titles }
    })
  }, [survivors, relationships, byId])

  // ── Votação ──
  const voterKey = useMemo(() => getVoterKey(), [])
  const canVote = isSupabaseConfigured() && !!voterKey
  const [votes, setVotes] = useState({})
  const [myVote, setMyVote] = useState(null)
  const [busy, setBusy] = useState(false)

  const reloadVotes = () => {
    if (isSupabaseConfigured()) fetchFinalistVotes().then(setVotes).catch(() => {})
  }
  useEffect(() => {
    reloadVotes()
    try {
      setMyVote(localStorage.getItem('champi_myvote'))
    } catch {
      /* ignore */
    }
  }, [])

  const total = Object.values(votes).reduce((a, b) => a + b, 0)

  const vote = async (id) => {
    if (!canVote || busy) return
    setBusy(true)
    try {
      await castFinalistVote(voterKey, id)
      try {
        localStorage.setItem('champi_myvote', id)
      } catch {
        /* ignore */
      }
      setMyVote(id)
      reloadVotes()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  // ordena por votos (desc), depois nome
  const ranked = [...dossiers].sort(
    (a, b) => (votes[b.m.id] || 0) - (votes[a.m.id] || 0) || a.m.name.localeCompare(b.m.name)
  )

  return (
    <section className="mb-8">
      <h2 className="mb-1 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
        🏆 Reta Final · {survivors.length} finalistas
      </h2>
      <p className="mb-4 text-xs text-champi-text-dim">
        {canVote ? 'Vota no teu favorito para vencer a roda 👇 (um voto, podes mudar).' : 'Os últimos de pé.'}
      </p>

      <ul className="space-y-3">
        {ranked.map(({ m, lineages, titles }, i) => {
          const v = votes[m.id] || 0
          const pct = total ? Math.round((v / total) * 100) : 0
          const mine = myVote === m.id
          return (
            <li key={m.id} className={`card p-4 ${mine ? 'ring-1 ring-champi-gold' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center text-lg">{MEDALS[i] || `${i + 1}º`}</span>
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-champi-gold/60 bg-champi-ink text-xl font-bold text-champi-gold">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (m.name || '?').charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-champi-gold">{m.name}</p>
                  {m.nickname && <p className="truncate text-xs text-champi-text-dim">“{m.nickname}”</p>}
                  <div className="mt-1 flex flex-wrap gap-1">
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
                </div>
                {canVote && (
                  <button
                    onClick={() => vote(m.id)}
                    disabled={busy}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                      mine
                        ? 'border-champi-gold bg-champi-gold/15 text-champi-gold'
                        : 'border-champi-line text-champi-text-dim hover:border-champi-gold/60 hover:text-champi-gold'
                    }`}
                  >
                    {mine ? '✓ Votado' : '🗳️ Votar'}
                  </button>
                )}
              </div>

              {titles.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {titles.map((t, k) => (
                    <span key={k} className="rounded-md bg-champi-ink-3/70 px-2 py-0.5 text-[11px] text-champi-text">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {canVote && (
                <div className="mt-2.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-champi-ink-3">
                    <div className="h-full rounded-full bg-champi-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-champi-text-dim">
                    {v} voto{v === 1 ? '' : 's'} · {pct}%
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {canVote && total > 0 && (
        <p className="mt-3 text-center text-xs text-champi-text-dim">{total} votos no total</p>
      )}
    </section>
  )
}
