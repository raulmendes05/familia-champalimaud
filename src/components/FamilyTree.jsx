import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { buildHierarchy, branchOf, secondaryParentEdges } from '../utils/tree'

const NODE_W = 168
const NODE_H = 64
const COLORS = {
  gold: '#d4af37',
  goldSoft: '#e8c969',
  purple: '#7c4dff',
  purpleSoft: '#a98bff',
  line: '#3a2a55',
  panel: '#241634',
  text: '#ece6f5',
  textDim: '#a99cc4',
  ink: '#140d1c',
}

/**
 * Árvore genealógica D3 renderizada em SVG.
 * Props:
 *  - members, relationships
 *  - orientation: 'vertical' | 'horizontal'
 *  - selectedId, highlightIds (Set de ids a destacar — p.ex. pesquisa)
 *  - dimGenerations (Set de gerações a esbater — filtro)
 *  - onSelect(member)
 */
export default function FamilyTree({
  members,
  relationships,
  orientation = 'vertical',
  selectedId = null,
  highlightIds = null,
  dimGenerations = null,
  onSelect = () => {},
}) {
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const zoomRef = useRef(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const containerRef = useRef(null)

  // Layout calculado uma vez por orientação/dados
  const layout = useMemo(() => {
    const data = buildHierarchy(members, relationships)
    const root = d3.hierarchy(data)
    const isVertical = orientation === 'vertical'
    const tree = d3
      .tree()
      .nodeSize(isVertical ? [NODE_W + 26, NODE_H + 80] : [NODE_H + 34, NODE_W + 90])
    tree(root)

    // Nós reais (ignora a raiz virtual __root__)
    const nodes = root.descendants().filter((d) => d.data.id !== '__root__')
    const links = root.links().filter((l) => l.source.data.id !== '__root__')

    // Coordenadas em ecrã consoante orientação
    const place = (d) =>
      isVertical ? { x: d.x, y: d.y } : { x: d.y, y: d.x }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    const posById = new Map()
    for (const n of nodes) {
      const p = place(n)
      posById.set(n.data.id, p)
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }

    // ── Ligações de co-padrinho (2.º padrinho) ──────────────────────
    // Encaminhadas por um canal POR BAIXO da árvore, cada uma na sua
    // "pista" (y distinto) → os troços horizontais nunca se sobrepõem.
    const secRaw = secondaryParentEdges(members, relationships)
      .map((e) => ({
        parent_id: e.parent_id,
        child_id: e.child_id,
        s: posById.get(e.parent_id),
        t: posById.get(e.child_id),
      }))
      .filter((e) => e.s && e.t)

    // Partição por intervalos: pistas só são partilhadas se os intervalos
    // em x não se cruzarem (assim os horizontais nunca colidem).
    const withSpan = secRaw
      .map((e) => ({ ...e, lo: Math.min(e.s.x, e.t.x), hi: Math.max(e.s.x, e.t.x) }))
      .sort((a, b) => a.lo - b.lo)
    const laneRight = [] // x máx. já ocupado em cada pista
    for (const e of withSpan) {
      let lane = laneRight.findIndex((r) => r < e.lo - 8)
      if (lane === -1) {
        lane = laneRight.length
        laneRight.push(-Infinity)
      }
      laneRight[lane] = e.hi
      e.lane = lane
    }

    const channelTop = maxY + NODE_H / 2 + 34
    const laneGap = 26
    const R = 10 // raio dos cantos
    const secondary = withSpan.map((e) => {
      const laneY = channelTop + e.lane * laneGap
      const sx = e.s.x
      const sy = e.s.y + NODE_H / 2 // sai por baixo do padrinho
      const tx = e.t.x
      const ty = e.t.y + NODE_H / 2 // entra por baixo do afilhado
      const dir = tx >= sx ? 1 : -1
      // desce → canto → horizontal na pista → canto → sobe
      const d = [
        `M ${sx} ${sy}`,
        `L ${sx} ${laneY - R}`,
        `Q ${sx} ${laneY} ${sx + dir * R} ${laneY}`,
        `L ${tx - dir * R} ${laneY}`,
        `Q ${tx} ${laneY} ${tx} ${laneY - R}`,
        `L ${tx} ${ty}`,
      ].join(' ')
      return { d, parent_id: e.parent_id, child_id: e.child_id }
    })

    const channelBottom = secondary.length
      ? channelTop + (laneRight.length - 1) * laneGap
      : maxY

    return {
      nodes,
      links,
      place,
      secondary,
      bounds: { minX, maxX, minY, maxY: Math.max(maxY, channelBottom) },
    }
  }, [members, relationships, orientation])

  // Ramo destacado a partir da selecção
  const branch = useMemo(
    () => (selectedId ? branchOf(selectedId, relationships) : null),
    [selectedId, relationships]
  )

  // Observa o tamanho do contentor
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ width: r.width, height: r.height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Configura zoom/pan
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)
    const zoom = d3
      .zoom()
      .scaleExtent([0.25, 2.5])
      .on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)
    zoomRef.current = zoom
    return () => svg.on('.zoom', null)
  }, [])

  // Centra a árvore quando layout/tamanho mudam
  useEffect(() => {
    if (!zoomRef.current || !size.width) return
    const { minX, maxX, minY, maxY } = layout.bounds
    const treeW = maxX - minX + NODE_W
    const treeH = maxY - minY + NODE_H
    const scale = Math.min(1, 0.92 / Math.max(treeW / size.width, treeH / size.height))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const transform = d3.zoomIdentity
      .translate(size.width / 2 - cx * scale, size.height / 2 - cy * scale)
      .scale(scale)
    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .call(zoomRef.current.transform, transform)
  }, [layout, size])

  const { nodes, links, place, secondary } = layout

  // d3.link generator para curvas suaves. As coordenadas já estão em espaço
  // de ecrã (place() trata da orientação), por isso basta escolher a curva.
  const linkPath = (l) => {
    const s = place(l.source)
    const t = place(l.target)
    const gen = orientation === 'vertical' ? d3.linkVertical() : d3.linkHorizontal()
    return gen({ source: [s.x, s.y], target: [t.x, t.y] })
  }

  const nodeState = (d) => {
    const id = d.data.id
    const inBranch = branch ? branch.has(id) : false
    const isSelected = id === selectedId
    const isSearchHit = highlightIds ? highlightIds.has(id) : false
    const isDimmed =
      (dimGenerations && dimGenerations.has(d.data.member?.generation)) ||
      (branch && !inBranch) ||
      (highlightIds && highlightIds.size > 0 && !isSearchHit)
    return { isSelected, inBranch, isSearchHit, isDimmed }
  }

  const linkActive = (l) => branch && branch.has(l.source.data.id) && branch.has(l.target.data.id)

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing">
        <defs>
          <linearGradient id="branchGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={COLORS.gold} />
            <stop offset="1" stopColor={COLORS.purple} />
          </linearGradient>
        </defs>
        <g ref={gRef}>
          {/* Ligações de co-padrinho (2.º padrinho) — desenhadas PRIMEIRO, por
              trás dos nós, encaminhadas por baixo em pistas separadas (sem
              sobreposições). Roxas tracejadas para se distinguirem das primárias. */}
          <g fill="none">
            {secondary.map((e, i) => {
              const active = branch && branch.has(e.parent_id) && branch.has(e.child_id)
              return (
                <path
                  key={`sec-${i}`}
                  d={e.d}
                  stroke={active ? 'url(#branchGrad)' : COLORS.purpleSoft}
                  strokeWidth={active ? 2.4 : 1.5}
                  strokeDasharray="6 5"
                  strokeOpacity={branch && !active ? 0.18 : 0.55}
                  strokeLinecap="round"
                />
              )
            })}
          </g>

          {/* Ligações da árvore (padrinho primário) — layout tidy, sem cruzamentos. */}
          <g fill="none">
            {links.map((l, i) => {
              const active = linkActive(l)
              return (
                <path
                  key={i}
                  d={linkPath(l)}
                  stroke={active ? 'url(#branchGrad)' : COLORS.line}
                  strokeWidth={active ? 2.4 : 1.4}
                  strokeOpacity={branch && !active ? 0.25 : 0.9}
                />
              )
            })}
          </g>

          {/* Nós */}
          <g>
            {nodes.map((d) => {
              const p = place(d)
              const m = d.data.member
              const { isSelected, isSearchHit, isDimmed } = nodeState(d)
              const stroke = isSelected
                ? COLORS.gold
                : isSearchHit
                  ? COLORS.purpleSoft
                  : COLORS.line
              return (
                <g
                  key={d.data.id}
                  transform={`translate(${p.x - NODE_W / 2}, ${p.y - NODE_H / 2})`}
                  className="cursor-pointer"
                  opacity={isDimmed ? 0.32 : 1}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(m)
                  }}
                  style={{ transition: 'opacity 0.25s' }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={14}
                    fill={COLORS.panel}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {/* Avatar / inicial */}
                  <circle cx={26} cy={NODE_H / 2} r={18} fill={COLORS.ink} stroke={stroke} strokeWidth={1.5} />
                  <text
                    x={26}
                    y={NODE_H / 2 + 5}
                    textAnchor="middle"
                    fontSize={15}
                    fontWeight="700"
                    fill={isSelected ? COLORS.gold : COLORS.purpleSoft}
                  >
                    {(m?.name || m?.nickname || '?').charAt(0)}
                  </text>
                  {/* Nome próprio (grande) + alcunha de praxe (pequena, se existir) */}
                  <text x={52} y={m?.nickname ? 26 : 31} fontSize={13.5} fontWeight="700" fill={COLORS.text}>
                    {truncate(m?.name, 14)}
                  </text>
                  {m?.nickname && (
                    <text x={52} y={43} fontSize={10.5} fill={COLORS.textDim}>
                      {truncate(m.nickname, 18)}
                    </text>
                  )}
                  <text x={52} y={56} fontSize={9.5} fill={COLORS.goldSoft}>
                    Gen {m?.generation}
                    {m?.faculty ? ` · ${m.faculty}` : ''}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      </svg>

      {/* Controlos de zoom */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <ZoomBtn label="+" onClick={() => zoomBy(svgRef, zoomRef, 1.3)} />
        <ZoomBtn label="–" onClick={() => zoomBy(svgRef, zoomRef, 1 / 1.3)} />
        <ZoomBtn label="⤢" title="Centrar" onClick={() => recenter(svgRef, zoomRef, layout, size)} />
      </div>
    </div>
  )
}

function ZoomBtn({ label, title, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="h-9 w-9 rounded-lg border border-champi-line bg-champi-ink-3/80 text-champi-text
        backdrop-blur transition hover:border-champi-gold/60 hover:text-champi-gold"
    >
      {label}
    </button>
  )
}

function zoomBy(svgRef, zoomRef, k) {
  if (!zoomRef.current) return
  d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, k)
}

function recenter(svgRef, zoomRef, layout, size) {
  if (!zoomRef.current || !size.width) return
  const { minX, maxX, minY, maxY } = layout.bounds
  const treeW = maxX - minX + NODE_W
  const treeH = maxY - minY + NODE_H
  const scale = Math.min(1, 0.92 / Math.max(treeW / size.width, treeH / size.height))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const transform = d3.zoomIdentity
    .translate(size.width / 2 - cx * scale, size.height / 2 - cy * scale)
    .scale(scale)
  d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.transform, transform)
}

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
