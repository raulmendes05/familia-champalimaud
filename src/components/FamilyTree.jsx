import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { buildHierarchy, branchOf } from '../utils/tree'
import { POSITIONS, SCALE, NODE, LINES } from '../data/layout'
import { FOUNDER_BADGES, isFounder } from '../data/founders'
import { glyphFor } from './FounderBadge'

const NODE_W = 150
const NODE_H = 54
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
  secondaryShown = null,
  lineageIds = null,
  onSelect = () => {},
}) {
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const zoomRef = useRef(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const containerRef = useRef(null)

  // Árvore tidy (só padrinho principal) — limpa, sem cruzamentos.
  const layout = useMemo(
    () => autoLayout(members, relationships, orientation),
    [members, relationships, orientation]
  )

  const branch = useMemo(
    () => (selectedId ? branchOf(selectedId, relationships) : null),
    [selectedId, relationships]
  )

  // Conjunto a destacar: linhagem (se ativa) tem prioridade sobre o ramo.
  const highlight = lineageIds || branch

  // Linhas do 2.º padrinho (co-padrinho) mostradas a pedido pelo painel.
  const secondaryEdges = useMemo(() => {
    if (!secondaryShown || secondaryShown.size === 0) return []
    const VERT = new Set(['padrinho', 'madrinha'])
    const out = []
    for (const r of relationships) {
      if (!VERT.has(r.type) || r.is_primary) continue
      if (!secondaryShown.has(r.child_id)) continue
      const s = layout.posById.get(r.parent_id)
      const t = layout.posById.get(r.child_id)
      if (s && t) out.push({ s, t, key: `${r.parent_id}>${r.child_id}` })
    }
    return out
  }, [secondaryShown, relationships, layout])

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
    const inBranch = highlight ? highlight.has(id) : false
    const isSelected = id === selectedId
    const isSearchHit = highlightIds ? highlightIds.has(id) : false
    const isDimmed =
      (dimGenerations && dimGenerations.has(d.data.member?.generation)) ||
      (highlight && !inBranch) ||
      (highlightIds && highlightIds.size > 0 && !isSearchHit)
    return { isSelected, inBranch, isSearchHit, isDimmed }
  }

  const linkActive = (l) => highlight && highlight.has(l.source) && highlight.has(l.target)

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing">
        <defs>
          <clipPath id="champi-avatar">
            <circle cx={25} cy={NODE_H / 2} r={18} />
          </clipPath>
        </defs>
        <g ref={gRef}>
          {/* Conectores: roxos normais; dourados quando na linhagem/ramo destacado */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {lines
              ? lines.map((l, i) => (
                  <polyline key={i} points={l.pts} stroke={COLORS.purple} strokeWidth={1.9} strokeOpacity={highlight ? 0.22 : 0.62} />
                ))
              : links.map((l, i) => {
                  const active = linkActive(l)
                  return (
                    <path
                      key={i}
                      d={l.d}
                      stroke={active ? COLORS.gold : COLORS.purple}
                      strokeWidth={active ? 2.6 : 1.7}
                      strokeOpacity={highlight && !active ? 0.18 : active ? 0.95 : 0.6}
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
              const photo = m?.photo_url
              const founder = isFounder(d.data.id) ? FOUNDER_BADGES[d.data.id] : null
              const glyph = founder && glyphFor(founder.icon)
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
                  <circle cx={25} cy={NODE_H / 2} r={18} fill={COLORS.ink} />
                  {photo ? (
                    <image
                      href={photo}
                      x={7}
                      y={NODE_H / 2 - 18}
                      width={36}
                      height={36}
                      clipPath="url(#champi-avatar)"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <text
                      x={25}
                      y={NODE_H / 2 + 5}
                      textAnchor="middle"
                      fontSize={16}
                      fontWeight="700"
                      fill={isSelected ? COLORS.gold : COLORS.purpleSoft}
                    >
                      {(m?.name || m?.nickname || '?').charAt(0)}
                    </text>
                  )}
                  <circle cx={25} cy={NODE_H / 2} r={18} fill="none" stroke={stroke} strokeWidth={1.4} />
                  <text x={52} y={m?.nickname ? 23 : 31} fontSize={12.5} fontWeight="700" fill={COLORS.text}>
                    {truncate(m?.name, 13)}
                  </text>
                  {m?.nickname && (
                    <text x={52} y={38} fontSize={9} fill={COLORS.textDim}>
                      {truncate(m.nickname, 18)}
                    </text>
                  )}
                  {founder &&
                    (glyph ? (
                      <g transform={`translate(${NODE_W / 2 - 11}, -30) scale(0.92)`}>
                        <glyph.C color={founder.color} />
                      </g>
                    ) : (
                      <text x={NODE_W / 2} y={-9} textAnchor="middle" fontSize={18}>
                        {founder.emoji}
                      </text>
                    ))}
                </g>
              )
            })}
          </g>

          {/* Linha(s) do 2.º padrinho (mostradas a pedido pelo painel) —
              por cima de tudo, dourado tracejado, claramente um destaque. */}
          {secondaryEdges.length > 0 && (
            <g fill="none">
              {secondaryEdges.map((e) => {
                const my = (e.s.y + e.t.y) / 2
                return (
                  <path
                    key={e.key}
                    d={`M ${e.s.x} ${e.s.y} C ${e.s.x} ${my} ${e.t.x} ${my} ${e.t.x} ${e.t.y}`}
                    stroke={COLORS.gold}
                    strokeWidth={2.6}
                    strokeDasharray="7 5"
                    strokeOpacity={0.95}
                  />
                )
              })}
            </g>
          )}
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
  const centers = nodes.map((n) => ({ id: n.data.id, x: n.x, y: n.y }))
  const scaled = LINES.map((l) => l.p.map(([x, y]) => [x * SCALE, y * SCALE]))
  const connected = new Set()

  // Passagem 1 — liga cada extremidade ao nó que está MESMO em frente (na
  // direção da própria linha), fechando o espaço até à caixa.
  const SNAP_MAX = 100, PERP = 52
  const snapDirectional = (E, NB) => {
    const dx = E[0] - NB[0], dy = E[1] - NB[1]
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    let best = null, bestAlong = SNAP_MAX
    for (const c of centers) {
      const vx = c.x - E[0], vy = c.y - E[1]
      const along = vx * ux + vy * uy
      if (along <= 0 || along > SNAP_MAX) continue
      if (Math.abs(vx * uy - vy * ux) > PERP) continue
      if (along < bestAlong) { bestAlong = along; best = c }
    }
    return best
  }
  for (const sc of scaled) {
    if (sc.length < 2) continue
    for (const [i, j] of [[0, 1], [sc.length - 1, sc.length - 2]]) {
      const hit = snapDirectional(sc[i], sc[j])
      if (hit) { sc[i] = [hit.x, hit.y]; connected.add(hit.id) }
    }
  }

  // Passagem 2 — para nós ainda sem ligação (fundadores com foto grande, etc.),
  // estica até eles a ponta de linha colinear mais próxima.
  for (const c of centers) {
    if (connected.has(c.id)) continue
    let bestRef = null, bestD = Infinity
    for (const sc of scaled) {
      for (const i of [0, sc.length - 1]) {
        const E = sc[i]
        const d = Math.hypot(E[0] - c.x, E[1] - c.y)
        const collinear = Math.abs(E[0] - c.x) < 30 && Math.abs(E[1] - c.y) < 280
        if ((d < 95 || collinear) && d < bestD) { bestD = d; bestRef = [sc, i] }
      }
    }
    if (bestRef) { bestRef[0][bestRef[1]] = [c.x, c.y]; connected.add(c.id) }
  }

  const lines = scaled.map((sc) => ({ pts: sc.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') }))

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
    return {
      d: gen({ source: [s.x, s.y], target: [t.x, t.y] }),
      source: l.source.data.id,
      target: l.target.data.id,
    }
  })
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  const posById = new Map()
  for (const n of nodes) {
    const p = place(n)
    posById.set(n.data.id, p)
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  return { nodes, lines: null, links, place, posById, bounds: { minX, maxX, minY, maxY } }
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
