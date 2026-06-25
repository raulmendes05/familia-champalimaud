import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { buildHierarchy, branchOf } from '../utils/tree'
import { POSITIONS, SCALE, ROUTE_OVERRIDES } from '../data/layout'

const NODE_W = 168
const NODE_H = 64
const R = 13 // raio dos cantos das ligações
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

const VERTICAL = new Set(['padrinho', 'madrinha'])

/** Cotovelo (vertical → horizontal → vertical) com cantos arredondados, do
 *  fundo do padrinho até ao topo do afilhado. Coordenadas já em ecrã. */
function elbow(s, t) {
  const sx = s.x, sy = s.y + NODE_H / 2
  const tx = t.x, ty = t.y - NODE_H / 2
  if (Math.abs(sx - tx) < 1) return `M ${sx} ${sy} L ${tx} ${ty}`
  const my = (sy + ty) / 2
  const dir = tx > sx ? 1 : -1
  const r = Math.min(R, Math.abs(tx - sx) / 2, Math.abs(my - sy), Math.abs(ty - my))
  return [
    `M ${sx} ${sy}`,
    `L ${sx} ${my - r}`,
    `Q ${sx} ${my} ${sx + dir * r} ${my}`,
    `L ${tx - dir * r} ${my}`,
    `Q ${tx} ${my} ${tx} ${my + r}`,
    `L ${tx} ${ty}`,
  ].join(' ')
}

/** Polilinha com cantos arredondados a partir de uma lista de pontos. */
function roundedPath(points, r = R) {
  if (points.length < 2) return ''
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const l1 = Math.hypot(x1 - x0, y1 - y0) || 1
    const l2 = Math.hypot(x2 - x1, y2 - y1) || 1
    const rr = Math.min(r, l1 / 2, l2 / 2)
    const ax = x1 - ((x1 - x0) / l1) * rr
    const ay = y1 - ((y1 - y0) / l1) * rr
    const bx = x1 + ((x2 - x1) / l2) * rr
    const by = y1 + ((y2 - y1) / l2) * rr
    d += ` L ${ax} ${ay} Q ${x1} ${y1} ${bx} ${by}`
  }
  const last = points[points.length - 1]
  d += ` L ${last[0]} ${last[1]}`
  return d
}

/**
 * Árvore genealógica D3 renderizada em SVG.
 * Usa o layout FIXO (réplica do PDF) sempre que todos os membros têm posição
 * definida em data/layout.js; caso contrário cai no layout automático (d3.tree).
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
    return usingFixed
      ? fixedLayout(members, relationships)
      : autoLayout(members, relationships, orientation)
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
      .scaleExtent([0.15, 2.5])
      .on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)
    zoomRef.current = zoom
    return () => svg.on('.zoom', null)
  }, [])

  // Centra a árvore quando layout/tamanho mudam
  useEffect(() => {
    if (!zoomRef.current || !size.width) return
    fitToView(svgRef, zoomRef, layout, size, 450)
  }, [layout, size])

  const { nodes, links, secondary, place } = layout

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

  const linkActive = (l) => branch && branch.has(l.source) && branch.has(l.target)

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
          {/* Ligações de co-padrinho (2.º padrinho) — tracejadas, por trás dos nós */}
          <g fill="none">
            {secondary.map((e, i) => {
              const active = linkActive(e)
              return (
                <path
                  key={`sec-${i}`}
                  d={e.d}
                  stroke={active ? 'url(#branchGrad)' : COLORS.purpleSoft}
                  strokeWidth={active ? 2.6 : 1.7}
                  strokeDasharray="7 5"
                  strokeOpacity={branch && !active ? 0.18 : 0.6}
                  strokeLinecap="round"
                />
              )
            })}
          </g>

          {/* Ligações primárias (padrinho principal) */}
          <g fill="none">
            {links.map((l, i) => {
              const active = linkActive(l)
              return (
                <path
                  key={i}
                  d={l.d}
                  stroke={active ? 'url(#branchGrad)' : COLORS.line}
                  strokeWidth={active ? 2.6 : 1.6}
                  strokeOpacity={branch && !active ? 0.22 : 0.95}
                  strokeLinecap="round"
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
                  opacity={isDimmed ? 0.3 : 1}
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
        <ZoomBtn label="⤢" title="Centrar" onClick={() => fitToView(svgRef, zoomRef, layout, size, 400)} />
      </div>
    </div>
  )
}

// ── Layout FIXO (réplica do PDF) ───────────────────────────────────
function fixedLayout(members, relationships) {
  const nodeById = new Map()
  const nodes = members.map((m) => {
    const [rx, ry] = POSITIONS[m.id]
    const n = { data: { id: m.id, member: m }, x: rx * SCALE.x, y: ry * SCALE.y }
    nodeById.set(m.id, n)
    return n
  })

  const links = []
  const secondary = []
  for (const r of relationships) {
    if (!VERTICAL.has(r.type)) continue
    const s = nodeById.get(r.parent_id)
    const t = nodeById.get(r.child_id)
    if (!s || !t) continue
    if (r.is_primary) {
      links.push({ d: elbow(s, t), source: r.parent_id, target: r.child_id })
    } else {
      const override = ROUTE_OVERRIDES[r.child_id]
      const d = override
        ? roundedPath(override.map(([x, y]) => [x * SCALE.x, y * SCALE.y]))
        : elbow(s, t)
      secondary.push({ d, source: r.parent_id, target: r.child_id })
    }
  }

  // Bounds incluindo os nós e os contornos das ligações por margem
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  const seen = (x, y) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  for (const n of nodes) seen(n.x, n.y)
  for (const pts of Object.values(ROUTE_OVERRIDES))
    for (const [x, y] of pts) seen(x * SCALE.x, y * SCALE.y)

  return {
    nodes,
    links,
    secondary,
    place: (d) => ({ x: d.x, y: d.y }),
    bounds: { minX, maxX, minY, maxY },
  }
}

// ── Layout AUTOMÁTICO (fallback: d3.tree) ──────────────────────────
function autoLayout(members, relationships, orientation) {
  const data = buildHierarchy(members, relationships)
  const root = d3.hierarchy(data)
  const isVertical = orientation === 'vertical'
  const tree = d3
    .tree()
    .nodeSize(isVertical ? [NODE_W + 26, NODE_H + 80] : [NODE_H + 34, NODE_W + 90])
  tree(root)

  const nodes = root.descendants().filter((d) => d.data.id !== '__root__')
  const rawLinks = root.links().filter((l) => l.source.data.id !== '__root__')
  const place = (d) => (isVertical ? { x: d.x, y: d.y } : { x: d.y, y: d.x })

  const links = rawLinks.map((l) => {
    const s = place(l.source)
    const t = place(l.target)
    const gen = isVertical ? d3.linkVertical() : d3.linkHorizontal()
    return {
      d: gen({ source: [s.x, s.y], target: [t.x, t.y] }),
      source: l.source.data.id,
      target: l.target.data.id,
    }
  })

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const n of nodes) {
    const p = place(n)
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  return { nodes, links, secondary: [], place, bounds: { minX, maxX, minY, maxY } }
}

function fitToView(svgRef, zoomRef, layout, size, duration) {
  if (!zoomRef.current || !size.width) return
  const { minX, maxX, minY, maxY } = layout.bounds
  const treeW = maxX - minX + NODE_W
  const treeH = maxY - minY + NODE_H
  const scale = Math.min(1, 0.94 / Math.max(treeW / size.width, treeH / size.height))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
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
