import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { buildHierarchy, branchOf } from '../utils/tree'
import { POSITIONS, SCALE, NODE, LINES } from '../data/layout'

const NODE_W = NODE.W
const NODE_H = NODE.H
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
 * Árvore genealógica — réplica fiel do PDF: nós nas posições exatas extraídas
 * do PDF e os conectores REAIS desenhados no PDF (sem cruzamentos, porque são
 * os do autor). Cai no layout automático (d3.tree) se faltar alguma posição.
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

  const layout = useMemo(() => {
    const usingFixed = members.length > 0 && members.every((m) => POSITIONS[m.id])
    return usingFixed ? fixedLayout(members) : autoLayout(members, relationships, orientation)
  }, [members, relationships, orientation])

  const branch = useMemo(
    () => (selectedId ? branchOf(selectedId, relationships) : null),
    [selectedId, relationships]
  )

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ width: r.width, height: r.height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)
    const zoom = d3.zoom().scaleExtent([0.12, 2.5]).on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)
    zoomRef.current = zoom
    return () => svg.on('.zoom', null)
  }, [])

  useEffect(() => {
    if (!zoomRef.current || !size.width) return
    fitToView(svgRef, zoomRef, layout, size, 450)
  }, [layout, size])

  const { nodes, lines, links, place } = layout

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

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing">
        <g ref={gRef}>
          {/* Conectores reais do PDF (ou links do d3 no modo automático) */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {lines
              ? lines.map((l, i) => (
                  <polyline
                    key={i}
                    points={l.pts}
                    stroke={l.c}
                    strokeWidth={2}
                    strokeOpacity={branch ? 0.4 : 0.92}
                  />
                ))
              : links.map((l, i) => (
                  <path key={i} d={l.d} stroke={COLORS.line} strokeWidth={1.6} strokeOpacity={0.9} />
                ))}
          </g>

          {/* Nós */}
          <g>
            {nodes.map((d) => {
              const p = place(d)
              const m = d.data.member
              const { isSelected, isSearchHit, isDimmed } = nodeState(d)
              const stroke = isSelected ? COLORS.gold : isSearchHit ? COLORS.purpleSoft : COLORS.line
              return (
                <g
                  key={d.data.id}
                  transform={`translate(${p.x - NODE_W / 2}, ${p.y - NODE_H / 2})`}
                  className="cursor-pointer"
                  opacity={isDimmed ? 0.28 : 1}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(m)
                  }}
                  style={{ transition: 'opacity 0.2s' }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={11}
                    fill={COLORS.panel}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2.5 : 1.4}
                  />
                  <circle cx={20} cy={NODE_H / 2} r={13} fill={COLORS.ink} stroke={stroke} strokeWidth={1.3} />
                  <text
                    x={20}
                    y={NODE_H / 2 + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="700"
                    fill={isSelected ? COLORS.gold : COLORS.purpleSoft}
                  >
                    {(m?.name || m?.nickname || '?').charAt(0)}
                  </text>
                  <text x={38} y={m?.nickname ? 20 : 27} fontSize={11.5} fontWeight="700" fill={COLORS.text}>
                    {truncate(m?.name, 13)}
                  </text>
                  {m?.nickname && (
                    <text x={38} y={33} fontSize={8.5} fill={COLORS.textDim}>
                      {truncate(m.nickname, 17)}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </g>
      </svg>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <ZoomBtn label="+" onClick={() => zoomBy(svgRef, zoomRef, 1.3)} />
        <ZoomBtn label="–" onClick={() => zoomBy(svgRef, zoomRef, 1 / 1.3)} />
        <ZoomBtn label="⤢" title="Centrar" onClick={() => fitToView(svgRef, zoomRef, layout, size, 400)} />
      </div>
    </div>
  )
}

// ── Layout FIXO (réplica do PDF) ───────────────────────────────────
function fixedLayout(members) {
  const nodes = members.map((m) => {
    const [rx, ry] = POSITIONS[m.id]
    return { data: { id: m.id, member: m }, x: rx * SCALE, y: ry * SCALE }
  })
  const lines = LINES.map((l) => ({
    c: l.c,
    pts: l.p.map(([x, y]) => `${(x * SCALE).toFixed(1)},${(y * SCALE).toFixed(1)}`).join(' '),
  }))

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  const seen = (x, y) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  for (const n of nodes) seen(n.x, n.y)
  for (const l of LINES) for (const [x, y] of l.p) seen(x * SCALE, y * SCALE)

  return { nodes, lines, links: null, place: (d) => ({ x: d.x, y: d.y }), bounds: { minX, maxX, minY, maxY } }
}

// ── Layout AUTOMÁTICO (fallback: d3.tree) ──────────────────────────
function autoLayout(members, relationships, orientation) {
  const root = d3.hierarchy(buildHierarchy(members, relationships))
  const isVertical = orientation === 'vertical'
  d3.tree().nodeSize(isVertical ? [NODE_W + 26, NODE_H + 80] : [NODE_H + 34, NODE_W + 90])(root)
  const nodes = root.descendants().filter((d) => d.data.id !== '__root__')
  const rawLinks = root.links().filter((l) => l.source.data.id !== '__root__')
  const place = (d) => (isVertical ? { x: d.x, y: d.y } : { x: d.y, y: d.x })
  const links = rawLinks.map((l) => {
    const s = place(l.source), t = place(l.target)
    const gen = isVertical ? d3.linkVertical() : d3.linkHorizontal()
    return { d: gen({ source: [s.x, s.y], target: [t.x, t.y] }) }
  })
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const n of nodes) {
    const p = place(n)
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  return { nodes, lines: null, links, place, bounds: { minX, maxX, minY, maxY } }
}

function fitToView(svgRef, zoomRef, layout, size, duration) {
  if (!zoomRef.current || !size.width) return
  const { minX, maxX, minY, maxY } = layout.bounds
  const treeW = maxX - minX + NODE_W
  const treeH = maxY - minY + NODE_H
  const scale = Math.min(1, 0.94 / Math.max(treeW / size.width, treeH / size.height))
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const transform = d3.zoomIdentity
    .translate(size.width / 2 - cx * scale, size.height / 2 - cy * scale)
    .scale(scale)
  d3.select(svgRef.current).transition().duration(duration).call(zoomRef.current.transform, transform)
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

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
