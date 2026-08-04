import { useMemo, useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import FamilyTree from '../components/FamilyTree'
import MemberPanel from '../components/MemberPanel'
import Oraculo from '../components/Oraculo'
import RoletaTimeline from '../components/RoletaTimeline'
import Finalistas from '../components/Finalistas'
import Podio from '../components/Podio'
import { ELIMINATIONS, ROULETTE_EXCLUDED, eliminationMap } from '../data/roleta'
import { lineageOf } from '../utils/tree'
import { isFounder, LINEAGE_LABELS } from '../data/founders'

export default function RoletaPage() {
  const { members, relationships } = useMembers()
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const elimMap = useMemo(() => eliminationMap(), [])

  const excluded = new Set(ROULETTE_EXCLUDED)
  const participants = members.filter((m) => !excluded.has(m.id))
  const survivors = participants
    .filter((m) => !elimMap.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const dia = ELIMINATIONS.length

  // ── Vista (lista vs árvore dos vivos) + estado da árvore ──
  const [view, setView] = useState('lista')
  const [selected, setSelected] = useState(null)
  const [lineageId, setLineageId] = useState(null)
  const [secondaryShown, setSecondaryShown] = useState(() => new Set())

  // Árvore dos vivos: cada sobrevivente liga-se ao antepassado VIVO mais próximo
  // na sua linhagem primária (saltando padrinhos já eliminados), para manter a
  // mesma descendência. EXCEÇÃO: um fundador eliminado continua a aparecer (como
  // "caído", a cinzento) a servir de raiz, para que a descendência viva dele
  // continue claramente identificada como sua.
  const { treeMembers, treeRels, ghostIds, ghostLabels } = useMemo(() => {
    const aliveSet = new Set(survivors.map((m) => m.id))

    // Fundadores eliminados que ainda têm descendência viva → mantidos como raiz.
    const ghost = new Set()
    for (const m of survivors) {
      const fId = lineageOf(m.id, relationships)[0]
      if (fId && isFounder(fId) && !aliveSet.has(fId)) ghost.add(fId)
    }

    const attach = new Set([...aliveSet, ...ghost])
    const rels = []
    for (const m of survivors) {
      const lin = lineageOf(m.id, relationships) // [fundador, …, m]
      for (let i = lin.length - 2; i >= 0; i--) {
        if (attach.has(lin[i])) {
          rels.push({
            id: `s-${lin[i]}-${m.id}`,
            parent_id: lin[i],
            child_id: m.id,
            type: 'padrinho',
            is_primary: true,
          })
          break
        }
      }
    }

    const ghostMembers = [...ghost].map((id) => byId.get(id)).filter(Boolean)
    const labels = {}
    for (const id of ghost) labels[id] = LINEAGE_LABELS[id] || `Linhagem ${byId.get(id)?.name || ''}`
    return { treeMembers: [...survivors, ...ghostMembers], treeRels: rels, ghostIds: ghost, ghostLabels: labels }
    // survivors/relationships mudam a cada eliminação → recomputa
  }, [survivors, relationships, byId])

  const lineageIds = useMemo(
    () => (lineageId ? new Set(lineageOf(lineageId, relationships)) : null),
    [lineageId, relationships]
  )

  const toggleLineage = (id) => setLineageId((cur) => (cur === id ? null : id))
  const toggleSecondary = (id) =>
    setSecondaryShown((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Cabeçalho + alternador */}
      <div className="mx-auto w-full max-w-5xl px-6 pt-6">
        <h1 className="font-display text-3xl font-semibold text-champi-gold">🎰 Roleta Champi</h1>
        <p className="mt-1 text-sm text-champi-text-dim">
          Todos os dias alguém é “expulso” da família (tudo na brincadeira). Aqui ficam os
          sobreviventes e a cronologia das eliminações.{' '}
          <span className="text-champi-text-dim/40 italic">O m0guels tem isto tudo comprado!</span>
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-champi-line bg-champi-ink-2/80 p-1.5 backdrop-blur">
          <ViewBtn active={view === 'lista'} onClick={() => setView('lista')}>
            📜 Lista
          </ViewBtn>
          <ViewBtn active={view === 'arvore'} onClick={() => setView('arvore')}>
            🌳 Árvore dos vivos
          </ViewBtn>
          <ViewBtn active={view === 'oraculo'} onClick={() => setView('oraculo')}>
            🔮 Oráculo
          </ViewBtn>
        </div>
      </div>

      {view === 'oraculo' ? (
        <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <Oraculo survivors={survivors} members={members} relationships={relationships} dia={dia} />
        </div>
      ) : view === 'lista' ? (
        <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-6 pb-6 pt-5">
          {/* Estatísticas */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={dia} label="Dia atual" />
            <Stat value={survivors.length} label="Sobreviventes" tone="green" />
            <Stat value={participants.length - survivors.length} label="Eliminados" tone="red" />
            <Stat value={participants.length} label="Na roleta" />
          </div>

          {/* Pódio final (roleta terminada) / Reta Final / lista */}
          {survivors.length === 1 ? (
            <Podio champion={survivors[0]} members={members} relationships={relationships} />
          ) : survivors.length > 1 && survivors.length <= 6 ? (
            <Finalistas survivors={survivors} members={members} relationships={relationships} />
          ) : (
            <section className="mb-8">
              <h2 className="mb-3 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
                🟢 Ainda na família · {survivors.length}
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
                {survivors.map((m) => (
                  <div key={m.id} className="flex flex-col items-center text-center">
                    <Avatar member={m} />
                    <p className="mt-1 w-full truncate text-xs font-medium text-champi-text">{m.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gráfico + cronologia com marcos */}
          <RoletaTimeline members={members} relationships={relationships} />
        </div>
      ) : (
        <div className="relative mt-3 flex-1 overflow-hidden border-t border-champi-line/60">
          {survivors.length > 0 ? (
            <FamilyTree
              members={treeMembers}
              relationships={treeRels}
              selectedId={selected?.id || null}
              secondaryShown={secondaryShown}
              lineageIds={lineageIds}
              ghostIds={ghostIds}
              ghostLabels={ghostLabels}
              onSelect={setSelected}
            />
          ) : (
            <p className="grid h-full place-items-center text-sm text-champi-text-dim">
              Já não resta ninguém vivo na roleta. 💀
            </p>
          )}

          {/* Legenda */}
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-champi-line bg-champi-ink-2/80 px-3 py-1.5 text-xs text-champi-text-dim backdrop-blur">
            🌳 {survivors.length} ainda vivos · só quem sobrevive à roleta
            {ghostIds.size > 0 && <span> · etiqueta = linhagem de fundador caído</span>}
          </div>

          <MemberPanel
            member={selected}
            members={members}
            relationships={relationships}
            secondaryShown={secondaryShown}
            onToggleSecondary={toggleSecondary}
            lineageActive={lineageId === selected?.id}
            onToggleLineage={toggleLineage}
            onSelect={setSelected}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  )
}

function ViewBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-champi-gold text-champi-ink' : 'text-champi-text-dim hover:text-champi-text'
      }`}
    >
      {children}
    </button>
  )
}

function Avatar({ member, dead = false }) {
  const photo = member?.photo_url
  return (
    <div
      className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 ${
        dead ? 'border-champi-line opacity-70 grayscale' : 'border-champi-gold/60'
      } bg-champi-ink text-lg font-bold text-champi-gold`}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (member?.name || '?').charAt(0)
      )}
    </div>
  )
}

function Stat({ value, label, tone }) {
  const color =
    tone === 'green' ? 'text-emerald-400' : tone === 'red' ? 'text-red-400' : 'text-champi-text'
  return (
    <div className="card p-3 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-champi-text-dim">{label}</p>
    </div>
  )
}
