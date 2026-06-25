import { relationsOf } from '../utils/tree'
import { FACULDADES, memories } from '../data/mockData'

const TYPE_LABEL = {
  padrinho: 'Padrinho',
  madrinha: 'Madrinha',
  irmao: 'Irmão de praxe',
}

/**
 * Painel lateral com o perfil do membro selecionado.
 * Props: member, members, relationships, onSelect(member), onClose()
 */
export default function MemberPanel({ member, members, relationships, onSelect, onClose }) {
  if (!member) return null
  const { padrinhos, afilhados, irmaos } = relationsOf(member.id, members, relationships)
  const memberMemories = memories.filter((mm) => mm.member_id === member.id)
  const byId = (id) => members.find((m) => m.id === id)

  return (
    <aside
      className="card animate-fade-in absolute right-4 top-4 z-20 flex max-h-[calc(100%-2rem)] w-[340px]
        flex-col overflow-hidden shadow-glow"
    >
      {/* Cabeçalho */}
      <div className="relative bg-gradient-to-br from-champi-purple-deep/60 to-champi-ink-3 p-5">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full
            border border-champi-line/60 text-champi-text-dim hover:text-champi-gold"
          aria-label="Fechar"
        >
          ✕
        </button>
        <div className="flex items-center gap-3">
          <div
            className="grid h-16 w-16 place-items-center rounded-full border-2 border-champi-gold
              bg-champi-ink text-2xl font-bold text-champi-gold"
          >
            {member.photo_url ? (
              <img src={member.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              (member.name || member.nickname).charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold leading-tight text-champi-gold">
              {member.name}
            </p>
            {member.nickname && (
              <p className="truncate text-sm text-champi-text">“{member.nickname}”</p>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="chip">Gen {member.generation}</span>
              <span className="chip">{member.year_joined}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {member.quote && (
          <p className="border-l-2 border-champi-gold/70 pl-3 font-display text-lg italic text-champi-text">
            “{member.quote}”
          </p>
        )}

        <Field label="Curso" value={member.course} />
        <Field label="Faculdade" value={FACULDADES[member.faculty] || member.faculty} />
        {member.bio && <Field label="Sobre" value={member.bio} />}

        <RelGroup title="Padrinhos" items={padrinhos} onSelect={onSelect} />
        <RelGroup title="Afilhados" items={afilhados} onSelect={onSelect} />
        <RelGroup title="Irmãos de praxe" items={irmaos} onSelect={onSelect} />

        {memberMemories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
              Memórias
            </p>
            <ul className="space-y-2">
              {memberMemories.map((mm) => (
                <li key={mm.id} className="rounded-lg bg-champi-ink-3/60 p-3 text-sm text-champi-text">
                  <p className="italic">“{mm.text}”</p>
                  <p className="mt-1 text-xs text-champi-text-dim">
                    — {byId(mm.author_id)?.name || 'Anónimo'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  )
}

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-champi-text-dim">{label}</p>
      <p className="text-sm text-champi-text">{value}</p>
    </div>
  )
}

function RelGroup({ title, items, onSelect }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(({ member: m, type }) => (
          <button
            key={m.id + type}
            onClick={() => onSelect(m)}
            title={TYPE_LABEL[type]}
            className="chip transition hover:border-champi-gold/70 hover:text-champi-gold"
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  )
}
