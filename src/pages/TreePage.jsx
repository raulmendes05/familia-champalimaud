import { useState } from 'react'
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

  const handleSelect = (m) => {
    setSelected(m)
    setSearchIds(null)
  }

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
          <Stats members={members} relationships={relationships} onSelect={handleSelect} />
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
