import { useMemo, useState } from 'react'
import FamilyTree from '../components/FamilyTree'
import MemberPanel from '../components/MemberPanel'
import SearchBar from '../components/SearchBar'
import Stats from '../components/Stats'
import { useMembers } from '../hooks/useMembers'

export default function TreePage() {
  const { members, relationships, loading } = useMembers()
  const [selected, setSelected] = useState(null)
  const [orientation, setOrientation] = useState('vertical')
  const [searchIds, setSearchIds] = useState(null)
  const [dimGenerations, setDimGenerations] = useState(null)
  const [showPanels, setShowPanels] = useState(true)
  const [secondaryShown, setSecondaryShown] = useState(() => new Set())

  const handleSelect = (m) => {
    setSelected(m)
    setSearchIds(null)
  }

  const toggleSecondary = (id) =>
    setSecondaryShown((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // Todos os afilhados com 2.º padrinho (para o botão "mostrar todas")
  const secondaryChildIds = useMemo(() => {
    const VERT = new Set(['padrinho', 'madrinha'])
    const ids = new Set()
    for (const r of relationships) if (VERT.has(r.type) && !r.is_primary) ids.add(r.child_id)
    return [...ids]
  }, [relationships])

  const allSecondaryOn =
    secondaryChildIds.length > 0 && secondaryChildIds.every((id) => secondaryShown.has(id))

  const toggleAllSecondary = () =>
    setSecondaryShown((prev) => {
      if (allSecondaryOn) {
        const next = new Set(prev)
        for (const id of secondaryChildIds) next.delete(id)
        return next
      }
      return new Set([...prev, ...secondaryChildIds])
    })

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <div className="flex flex-col items-center gap-3 text-champi-text-dim">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-champi-line border-t-champi-gold" />
          <p className="text-sm">A carregar a família…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <FamilyTree
        members={members}
        relationships={relationships}
        orientation={orientation}
        selectedId={selected?.id || null}
        highlightIds={searchIds}
        dimGenerations={dimGenerations}
        secondaryShown={secondaryShown}
        onSelect={handleSelect}
      />

      {/* Coluna de controlos à esquerda */}
      {showPanels && (
        <div className="absolute left-4 top-4 z-10 flex max-h-[calc(100%-2rem)] flex-col gap-3 overflow-y-auto pr-1">
          <SearchBar
            members={members}
            onResults={setSearchIds}
            onPickGeneration={setDimGenerations}
            onSelect={handleSelect}
          />
          <Stats
            members={members}
            relationships={relationships}
            onSelect={handleSelect}
            allSecondaryOn={allSecondaryOn}
            onToggleAllSecondary={toggleAllSecondary}
          />
        </div>
      )}

      {/* Barra de modos (topo-centro) */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-champi-line bg-champi-ink-2/80 p-1.5 backdrop-blur">
        <ModeBtn active={orientation === 'vertical'} onClick={() => setOrientation('vertical')}>
          ⬍ Vertical
        </ModeBtn>
        <ModeBtn active={orientation === 'horizontal'} onClick={() => setOrientation('horizontal')}>
          ⬌ Horizontal
        </ModeBtn>
        <div className="mx-1 h-5 w-px bg-champi-line" />
        <ModeBtn active={showPanels} onClick={() => setShowPanels((v) => !v)}>
          {showPanels ? 'Ocultar painéis' : 'Mostrar painéis'}
        </ModeBtn>
      </div>

      {/* Painel de perfil à direita */}
      <MemberPanel
        member={selected}
        members={members}
        relationships={relationships}
        secondaryShown={secondaryShown}
        onToggleSecondary={toggleSecondary}
        onSelect={setSelected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-champi-gold text-champi-ink'
          : 'text-champi-text-dim hover:text-champi-text'
      }`}
    >
      {children}
    </button>
  )
}
