// Verifica o encaminhador: passa alguma linha por dentro de um nó? Quantos
// cruzamentos entre linhas? Corre com: node scripts/check-routing.mjs
import { members, relationships } from '../src/data/mockData.js'
import { POSITIONS, SCALE } from '../src/data/layout.js'
import { routeAll, ROUTE_CFG } from '../src/utils/routing.js'

const VERTICAL = new Set(['padrinho', 'madrinha'])

const nodesById = new Map()
for (const m of members) {
  const p = POSITIONS[m.id]
  if (p) nodesById.set(m.id, { id: m.id, x: p[0] * SCALE.x, y: p[1] * SCALE.y })
}

const edges = relationships
  .filter((r) => VERTICAL.has(r.type))
  .map((r) => ({ parent: r.parent_id, child: r.child_id, primary: !!r.is_primary }))

const t0 = Date.now()
const { routes } = routeAll(nodesById, edges, ROUTE_CFG)
const ms = Date.now() - t0

// Caixas VERDADEIRAS dos nós (sem padding) — para verificar passagem por dentro.
const { W, H: NH } = { W: 168, H: 64 }
const boxes = [...nodesById.values()].map((n) => ({ x0: n.x - W / 2, x1: n.x + W / 2, y0: n.y - NH / 2, y1: n.y + NH / 2 }))

const segs = []
let failed = 0
for (const r of routes) {
  if (!r.points) { failed++; continue }
  for (let i = 0; i + 1 < r.points.length; i++) {
    const [x1, y1] = r.points[i], [x2, y2] = r.points[i + 1]
    segs.push({ x1, y1, x2, y2, h: Math.abs(y1 - y2) < 0.5, edge: `${r.parent}->${r.child}` })
  }
}

// (1) segmentos a atravessar o interior de uma caixa de nó
const E = 1.0 // tolerância: stubs tocam a aresta da própria caixa
let through = 0
const throughList = []
for (const s of segs) {
  const lo = { x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2) }
  const hi = { x: Math.max(s.x1, s.x2), y: Math.max(s.y1, s.y2) }
  for (const b of boxes) {
    if (s.h) {
      if (b.y0 + E < s.y1 && s.y1 < b.y1 - E && lo.x < b.x1 - E && hi.x > b.x0 + E) { through++; throughList.push(s.edge); break }
    } else {
      if (b.x0 + E < s.x1 && s.x1 < b.x1 - E && lo.y < b.y1 - E && hi.y > b.y0 + E) { through++; throughList.push(s.edge); break }
    }
  }
}

// (2) cruzamentos entre um horizontal e um vertical (de ligações diferentes)
function crosses(a, b) {
  // a horizontal, b vertical
  const ay = a.y1, ax0 = Math.min(a.x1, a.x2), ax1 = Math.max(a.x1, a.x2)
  const bx = b.x1, by0 = Math.min(b.y1, b.y2), by1 = Math.max(b.y1, b.y2)
  return ax0 < bx - 0.5 && bx < ax1 - 0.5 + 1 && bx > ax0 + 0.5 && by0 < ay - 0.5 && ay < by1 - 0.5
}
let crossings = 0
const blame = new Map()
const bump = (e) => blame.set(e, (blame.get(e) || 0) + 1)
const H = segs.filter((s) => s.h), V = segs.filter((s) => !s.h)
for (const a of H) for (const b of V) {
  if (a.edge === b.edge) continue
  const ax0 = Math.min(a.x1, a.x2), ax1 = Math.max(a.x1, a.x2)
  const by0 = Math.min(b.y1, b.y2), by1 = Math.max(b.y1, b.y2)
  if (ax0 + 0.5 < b.x1 && b.x1 < ax1 - 0.5 && by0 + 0.5 < a.y1 && a.y1 < by1 - 0.5) { crossings++; bump(a.edge); bump(b.edge) }
}
const worst = [...blame.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18)

console.log(`ligações: ${edges.length} | sem rota: ${failed} | tempo: ${ms}ms`)
console.log(`segmentos a PASSAR POR DENTRO de nós: ${through}`)
if (through) console.log('   →', [...new Set(throughList)].join(', '))
console.log(`cruzamentos linha×linha: ${crossings}`)
console.log('ligações com mais cruzamentos:')
for (const [e, n] of worst) console.log(`   ${n}×  ${e}`)
