import { relationsOf, founderOf } from '../utils/tree'
import { badgesFor } from '../utils/badges'
import { FACULDADES, memories } from '../data/mockData'
import { FOUNDER_BADGES } from '../data/founders'
import FounderBadge from './FounderBadge'

const TYPE_LABEL = {
  padrinho: 'Padrinho',
  madrinha: 'Madrinha',
  irmao: 'Irmão de praxe',
}

/**
 * Painel lateral com o perfil do membro selecionado.
 * Props: member, members, relationships, onSelect(member), onClose()
 */
export default function MemberPanel({
  member,
  members,
  relationships,
  secondaryShown = null,
  onToggleSecondary = () => {},
  lineageActive = false,
  onToggleLineage = () => {},
  onSelect,
  onClose,
  showTreeActions = true,
  className = 'card animate-fade-in absolute right-4 top-4 z-20 flex max-h-[calc(100%-2rem)] w-[340px] flex-col overflow-hidden shadow-glow',
}) {
  if (!member) return null
  const { padrinhos, afilhados, irmaos } = relationsOf(member.id, members, relationships)
  const memberMemories = memories.filter((mm) => mm.member_id === member.id)
  const byId = (id) => members.find((m) => m.id === id)
  const founderId = founderOf(member.id, relationships)
  const founder = FOUNDER_BADGES[founderId]
  const founderName = byId(founderId)?.name || founder?.label
  const badges = badgesFor(member, members, relationships)
  const photo = member.photo_url

  // 2.º(s) padrinho(s) — relações verticais não-primárias deste membro
  const VERT = new Set(['padrinho', 'madrinha'])
  const secondParents = relationships
    .filter((r) => VERT.has(r.type) && r.child_id === member.id && !r.is_primary)
    .map((r) => byId(r.parent_id))
    .filter(Boolean)
  const secondaryOn = secondaryShown ? secondaryShown.has(member.id) : false

  return (
    <aside className={className}>
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
            {photo || member.photo_url ? (
              <img src={photo || member.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              (member.name || member.nickname).charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold leading-tight text-champi-gold">
              {member.name}
            </p>
            {member.nickname && (
              <p className="break-words text-sm text-champi-text">“{member.nickname}”</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="chip">Gen {member.generation}</span>
              {member.year_joined && <span className="chip">{member.year_joined}</span>}
              {founder && <FounderBadge founderId={founderId} size={14} showLabel />}
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

        {badges.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
              Conquistas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.key}
                  title={b.desc}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={{
                    color: b.color,
                    borderColor: `${b.color}66`,
                    background: `${b.color}1a`,
                  }}
                >
                  <span className="text-sm leading-none">{b.emoji}</span>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <Field label="Curso" value={member.course} />
        <Field label="Faculdade" value={FACULDADES[member.faculty] || member.faculty} />
        {member.bio && <Field label="Sobre" value={member.bio} />}

        {showTreeActions && (
          <button
            onClick={() => onToggleLineage(member.id)}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              lineageActive
                ? 'border-champi-purple bg-champi-purple/20 text-champi-purple-soft'
                : 'border-champi-purple/50 text-champi-purple-soft hover:bg-champi-purple/10'
            }`}
          >
            <span className="text-base leading-none">🧬</span>
            {lineageActive
              ? 'Esconder linhagem'
              : `Ver linhagem${founderName ? ` (até ${founderName})` : ''}`}
          </button>
        )}

        <RelGroup title="Padrinhos" items={padrinhos} onSelect={onSelect} />

        {showTreeActions && secondParents.length > 0 && (
          <button
            onClick={() => onToggleSecondary(member.id)}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              secondaryOn
                ? 'border-champi-gold bg-champi-gold/15 text-champi-gold'
                : 'border-champi-gold/50 text-champi-gold hover:bg-champi-gold/10'
            }`}
          >
            <span className="text-base leading-none">{secondaryOn ? '✓' : '＋'}</span>
            {secondaryOn
              ? 'Esconder 2.º padrinho na árvore'
              : `Mostrar 2.º padrinho na árvore (${secondParents.map((p) => p.name).join(', ')})`}
          </button>
        )}

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
