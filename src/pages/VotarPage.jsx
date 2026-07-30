import { useEffect, useMemo, useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import { ROULETTE_EXCLUDED, eliminationMap } from '../data/roleta'
import { isSupabaseConfigured, fetchWinnerVotes, castWinnerVote } from '../lib/supabase'

export default function VotarPage() {
  const { members } = useMembers()
  const elimMap = useMemo(() => eliminationMap(), [])
  const excluded = useMemo(() => new Set(ROULETTE_EXCLUDED), [])

  const allMembers = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  )
  const finalists = useMemo(
    () =>
      members
        .filter((m) => !excluded.has(m.id) && !elimMap.has(m.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members, excluded, elimMap]
  )
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const [tally, setTally] = useState({})
  const [votedBy, setVotedBy] = useState({})
  const [voter, setVoter] = useState('') // id do membro que está a votar
  const [choice, setChoice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const reload = () => {
    if (isSupabaseConfigured()) fetchWinnerVotes().then(({ tally, votedBy }) => { setTally(tally); setVotedBy(votedBy) }).catch(() => {})
  }
  useEffect(reload, [])

  const alreadyVoted = voter && votedBy[voter]
  const total = Object.values(tally).reduce((a, b) => a + b, 0)

  const submit = async () => {
    if (!voter || !choice || busy) return
    setBusy(true)
    setErr(null)
    try {
      await castWinnerVote(voter, choice)
      reload()
      setVotedBy((v) => ({ ...v, [voter]: choice }))
    } catch (e) {
      setErr(e.message || String(e))
      reload()
    } finally {
      setBusy(false)
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-champi-text-dim">
        A votação precisa da base de dados (Supabase), que não está ligada neste ambiente.
      </div>
    )
  }

  const Results = () => (
    <div className="mt-6">
      <h2 className="mb-2 border-b border-champi-line pb-2 font-display text-lg font-semibold text-champi-text">
        📊 Resultados · {total} voto{total === 1 ? '' : 's'}
      </h2>
      <ul className="space-y-2">
        {finalists
          .map((m) => ({ m, v: tally[m.id] || 0 }))
          .sort((a, b) => b.v - a.v)
          .map(({ m, v }) => {
            const pct = total ? Math.round((v / total) * 100) : 0
            return (
              <li key={m.id}>
                <div className="mb-0.5 flex justify-between text-sm">
                  <span className="text-champi-text">{m.name}</span>
                  <span className="text-champi-text-dim">{v} · {pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-champi-ink-3">
                  <div className="h-full rounded-full bg-champi-gold" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
      </ul>
    </div>
  )

  return (
    <div className="mx-auto h-full w-full max-w-lg overflow-y-auto p-6">
      <h1 className="font-display text-3xl font-semibold text-champi-gold">🗳️ Aposta no Vencedor</h1>
      <p className="mt-1 text-sm text-champi-text-dim">
        Quem achas que vai ficar em <b>primeiro</b> na Roleta Champi? Só para membros da família — cada
        um vota uma vez e o voto fica trancado.
      </p>

      {/* Passo 1: quem és tu */}
      <div className="card mt-5 p-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
          1. Quem és tu?
        </label>
        <select
          value={voter}
          onChange={(e) => { setVoter(e.target.value); setChoice(null); setErr(null) }}
          className="w-full rounded-lg border border-champi-line bg-champi-ink-3/70 px-3 py-2.5 text-sm text-champi-text focus:border-champi-gold/60 focus:outline-none"
        >
          <option value="">— escolhe o teu nome —</option>
          {allMembers.map((m) => (
            <option key={m.id} value={m.id} disabled={!!votedBy[m.id]}>
              {m.name}
              {votedBy[m.id] ? ' ✓ (já votou)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Já votou → mostra e tranca */}
      {alreadyVoted && (
        <div className="card mt-4 p-4 text-center">
          <p className="text-sm text-champi-text">
            🔒 <b>{byId.get(voter)?.name}</b> já votou — apostou em{' '}
            <b className="text-champi-gold">{byId.get(votedBy[voter])?.name || '???'}</b>.
          </p>
          <p className="mt-1 text-xs text-champi-text-dim">O voto está trancado, não dá para mudar.</p>
          <Results />
        </div>
      )}

      {/* Passo 2: aposta */}
      {voter && !alreadyVoted && (
        <div className="card mt-4 p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
            2. Quem achas que vai ganhar?
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {finalists.map((m) => (
              <button
                key={m.id}
                onClick={() => setChoice(m.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition ${
                  choice === m.id
                    ? 'border-champi-gold bg-champi-gold/15'
                    : 'border-champi-line hover:border-champi-gold/60'
                }`}
              >
                <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 border-champi-gold/60 bg-champi-ink text-xl font-bold text-champi-gold">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (m.name || '?').charAt(0)
                  )}
                </span>
                <span className="text-xs font-medium text-champi-text">{m.name}</span>
              </button>
            ))}
          </div>

          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

          <button
            onClick={submit}
            disabled={!choice || busy}
            className="btn-gold mt-4 w-full disabled:opacity-50"
          >
            {busy ? 'A registar…' : choice ? `Apostar em ${byId.get(choice)?.name} 🔒` : 'Escolhe um finalista'}
          </button>
          <p className="mt-2 text-center text-[11px] text-champi-text-dim">
            Atenção: depois de confirmar, <b>não podes mudar</b>.
          </p>

          <Results />
        </div>
      )}

      {!voter && total > 0 && (
        <div className="card mt-4 p-4">
          <Results />
        </div>
      )}
    </div>
  )
}
