import { useMemo, useRef, useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import { useAuth } from '../hooks/useAuth'
import { founderOf } from '../utils/tree'
import { fileToScaledDataURL } from '../utils/photos'
import { updateMember } from '../lib/supabase'
import FounderBadge from '../components/FounderBadge'
import { FOUNDER_ORDER, FOUNDER_BADGES, LINEAGE_LABELS } from '../data/founders'

const GEN_LABEL = {
  1: 'Geração 1 · Fundadores',
  2: 'Geração 2',
  3: 'Geração 3',
  4: 'Geração 4',
  5: 'Geração 5',
}

export default function GenerationsPage() {
  const { members, relationships, patchMember } = useMembers()
  const { isAdmin } = useAuth()

  const founderById = useMemo(() => {
    const map = new Map()
    for (const m of members) map.set(m.id, founderOf(m.id, relationships))
    return map
  }, [members, relationships])

  const byGen = useMemo(() => {
    const groups = new Map()
    for (const m of [...members].sort((a, b) => a.name.localeCompare(b.name))) {
      if (!groups.has(m.generation)) groups.set(m.generation, [])
      groups.get(m.generation).push(m)
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [members])

  return (
    <div className="mx-auto h-full w-full max-w-6xl overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-champi-gold">Gerações</h1>
        <p className="mt-1 text-sm text-champi-text-dim">
          {isAdmin
            ? 'Estás em modo administrador — carrega numa pessoa para adicionar ou mudar a foto.'
            : 'As fotos da família. (Só o administrador pode adicioná-las.)'}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GenChart byGen={byGen} total={members.length} />
        <LineageDonut members={members} founderById={founderById} />
      </div>

      <div className="space-y-10">
        {byGen.map(([gen, list]) => (
          <section key={gen}>
            <div className="mb-3 flex items-baseline gap-3 border-b border-champi-line pb-2">
              <h2 className="font-display text-xl font-semibold text-champi-text">
                {GEN_LABEL[gen] || `Geração ${gen}`}
              </h2>
              <span className="text-sm text-champi-text-dim">{list.length} membros</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {list.map((m) => (
                <PhotoCard
                  key={m.id}
                  member={m}
                  founderId={founderById.get(m.id)}
                  isAdmin={isAdmin}
                  onSaved={(url) => patchMember(m.id, { photo_url: url })}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function GenChart({ byGen, total }) {
  if (!byGen.length) return null
  const max = Math.max(...byGen.map(([, l]) => l.length))
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-champi-text">Membros por geração</h2>
        <span className="text-sm text-champi-text-dim">{total} no total</span>
      </div>
      <div className="space-y-2.5">
        {byGen.map(([gen, list]) => {
          const n = list.length
          const pct = max ? Math.round((n / max) * 100) : 0
          return (
            <div key={gen} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-champi-text-dim">Gen {gen}</span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-champi-ink-3">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-champi-purple to-champi-gold pr-2 transition-all duration-500"
                  style={{ width: `${Math.max(pct, 6)}%` }}
                >
                  <span className="text-[10px] font-bold text-champi-ink">{n}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LineageDonut({ members, founderById }) {
  const byId = new Map(members.map((m) => [m.id, m]))
  const counts = new Map()
  for (const m of members) {
    const f = founderById.get(m.id)
    if (f) counts.set(f, (counts.get(f) || 0) + 1)
  }
  const data = FOUNDER_ORDER.map((id) => ({
    id,
    label: LINEAGE_LABELS[id] || byId.get(id)?.name || id,
    color: FOUNDER_BADGES[id]?.color || '#a98bff',
    count: counts.get(id) || 0,
  })).filter((d) => d.count > 0)

  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return null

  const r = 52
  const c = 2 * Math.PI * r
  let acc = 0

  return (
    <div className="card p-5">
      <h2 className="mb-4 font-display text-lg font-semibold text-champi-text">Membros por linhagem</h2>
      <div className="flex items-center gap-5">
        <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#241634" strokeWidth="20" />
            {data.map((d) => {
              const dash = (d.count / total) * c
              const seg = (
                <circle
                  key={d.id}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="20"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-acc}
                />
              )
              acc += dash
              return seg
            })}
          </g>
          <text x="70" y="66" textAnchor="middle" className="fill-champi-text" fontSize="22" fontWeight="700">
            {total}
          </text>
          <text x="70" y="84" textAnchor="middle" className="fill-champi-text-dim" fontSize="10">
            membros
          </text>
        </svg>
        <ul className="flex-1 space-y-1.5 text-sm">
          {data.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="flex-1 text-champi-text">{d.label}</span>
              <span className="text-champi-text-dim">
                {d.count} · {Math.round((d.count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function PhotoCard({ member, founderId, isAdmin, onSaved }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const photo = member.photo_url

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await fileToScaledDataURL(file)
      await updateMember(member.id, { photo_url: dataUrl })
      onSaved(dataUrl)
    } catch (err) {
      alert('Não consegui guardar a foto. Tens de estar com sessão iniciada como administrador.')
      console.error(err)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await updateMember(member.id, { photo_url: null })
      onSaved(null)
    } catch (err) {
      alert('Não consegui remover a foto.')
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card group overflow-hidden p-0 transition hover:border-champi-gold/50">
      <button
        onClick={() => isAdmin && inputRef.current?.click()}
        className={`relative block aspect-square w-full ${isAdmin ? '' : 'cursor-default'}`}
        title={isAdmin ? 'Adicionar / mudar foto' : member.name}
      >
        {photo ? (
          <img src={photo} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-champi-ink text-4xl font-bold text-champi-gold/70">
            {(member.name || member.nickname || '?').charAt(0)}
          </div>
        )}
        {isAdmin && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100">
            <span className="rounded-full border border-champi-gold/70 px-3 py-1 text-xs text-champi-gold">
              {busy ? 'A guardar…' : photo ? 'Mudar foto' : '＋ Adicionar foto'}
            </span>
          </div>
        )}
        {founderId && (
          <span className="absolute left-1.5 top-1.5">
            <FounderBadge founderId={founderId} size={14} />
          </span>
        )}
      </button>

      <div className="p-2.5">
        <p className="truncate font-display text-sm font-semibold text-champi-gold">{member.name}</p>
        {member.nickname && (
          <p className="truncate text-xs text-champi-text-dim">“{member.nickname}”</p>
        )}
        {isAdmin && photo && (
          <button onClick={remove} className="mt-1 text-[11px] text-champi-text-dim hover:text-champi-gold">
            remover foto
          </button>
        )}
      </div>

      {isAdmin && (
        <input ref={inputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      )}
    </div>
  )
}
