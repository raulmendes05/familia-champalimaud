import { useMemo, useRef, useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import { useAuth } from '../hooks/useAuth'
import { founderOf } from '../utils/tree'
import { fileToScaledDataURL } from '../utils/photos'
import { updateMember } from '../lib/supabase'
import FounderBadge from '../components/FounderBadge'

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
