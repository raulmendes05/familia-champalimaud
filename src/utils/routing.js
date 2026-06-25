// ╔══════════════════════════════════════════════════════════════╗
// ║  Encaminhador ortogonal — linhas só por corredores livres        ║
// ╚══════════════════════════════════════════════════════════════╝
// Dado o conjunto de nós (caixas) e as ligações (padrinho → afilhado),
// calcula um caminho ortogonal para cada ligação que NUNCA passa por dentro
// de um nó (garantido por construção: só anda por linhas-corredor que não
// intersectam nenhuma caixa) e que minimiza sobreposições/cruzamentos.

export const ROUTE_CFG = { W: 168, H: 64, PAD: 12, K: 2, MARGIN: 150, TURN: 26, OVERLAP: 4000, CROSS: 2200 }

const round = (v) => Math.round(v * 100) / 100

// Linhas-corredor entre centros consecutivos (+ margens nas pontas).
function buildLines(centers, half, pad, K, margin) {
  const lines = new Set(centers)
  const lo = centers[0] - half - pad
  const hi = centers[centers.length - 1] + half + pad
  for (let k = 1; k <= 3; k++) {
    lines.add(round(lo - (margin * k) / 3))
    lines.add(round(hi + (margin * k) / 3))
  }
  for (let i = 0; i + 1 < centers.length; i++) {
    const a = centers[i] + half + pad
    const b = centers[i + 1] - half - pad
    if (b - a > 3) for (let k = 1; k <= K; k++) lines.add(round(a + ((b - a) * k) / (K + 1)))
    else if (b - a > -2) lines.add(round((centers[i] + centers[i + 1]) / 2))
  }
  return [...lines].sort((p, q) => p - q)
}

// Segmento horizontal (y fixo, x em [x1,x2]) atravessa o interior de uma caixa?
function hBlocked(y, x1, x2, boxes) {
  const lo = Math.min(x1, x2), hi = Math.max(x1, x2)
  for (const b of boxes) if (b.y0 < y && y < b.y1 && lo < b.x1 - 0.01 && hi > b.x0 + 0.01) return true
  return false
}
function vBlocked(x, y1, y2, boxes) {
  const lo = Math.min(y1, y2), hi = Math.max(y1, y2)
  for (const b of boxes) if (b.x0 < x && x < b.x1 && lo < b.y1 - 0.01 && hi > b.y0 + 0.01) return true
  return false
}
const inside = (x, y, boxes) => boxes.some((b) => b.x0 < x && x < b.x1 && b.y0 < y && y < b.y1)

// Min-heap simples por f.
class Heap {
  constructor() { this.a = [] }
  get size() { return this.a.length }
  push(n) { const a = this.a; a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break;[a[p], a[i]] = [a[i], a[p]]; i = p } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let s = i; if (l < a.length && a[l].f < a[s].f) s = l; if (r < a.length && a[r].f < a[s].f) s = r; if (s === i) break;[a[s], a[i]] = [a[i], a[s]]; i = s } } return top } }

export function buildRouter(nodesById, cfg = ROUTE_CFG) {
  const { W, H, PAD, K, MARGIN } = cfg
  const nodes = [...nodesById.values()]
  const boxes = nodes.map((n) => ({ x0: n.x - W / 2 - PAD, x1: n.x + W / 2 + PAD, y0: n.y - H / 2 - PAD, y1: n.y + H / 2 + PAD }))

  const colX = [...new Set(nodes.map((n) => round(n.x)))].sort((a, b) => a - b)
  const rowY = [...new Set(nodes.map((n) => round(n.y)))].sort((a, b) => a - b)
  const xs = buildLines(colX, W / 2, PAD, K, MARGIN)
  const ys = buildLines(rowY, H / 2, PAD, K, MARGIN)
  const xi = new Map(xs.map((v, i) => [v, i]))
  const yi = new Map(ys.map((v, i) => [v, i]))

  // Grafo de pontos da grelha (exclui os que caem dentro de caixas).
  const nx = xs.length, ny = ys.length
  const id = (ix, iy) => ix * ny + iy
  const valid = new Uint8Array(nx * ny)
  for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < ny; iy++) valid[id(ix, iy)] = inside(xs[ix], ys[iy], boxes) ? 0 : 1

  // Vizinhos (4 direcções) com segmento livre de caixas.
  const neigh = Array.from({ length: nx * ny }, () => [])
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      if (!valid[id(ix, iy)]) continue
      if (ix + 1 < nx && valid[id(ix + 1, iy)] && !hBlocked(ys[iy], xs[ix], xs[ix + 1], boxes)) {
        const len = xs[ix + 1] - xs[ix]
        neigh[id(ix, iy)].push({ to: id(ix + 1, iy), len, dir: 0 })
        neigh[id(ix + 1, iy)].push({ to: id(ix, iy), len, dir: 0 })
      }
      if (iy + 1 < ny && valid[id(ix, iy + 1)] && !vBlocked(xs[ix], ys[iy], ys[iy + 1], boxes)) {
        const len = ys[iy + 1] - ys[iy]
        neigh[id(ix, iy)].push({ to: id(ix, iy + 1), len, dir: 1 })
        neigh[id(ix, iy + 1)].push({ to: id(ix, iy), len, dir: 1 })
      }
    }
  }

  const used = new Set() // segmentos já usados (chave normalizada) → penaliza sobreposição
  const segKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  // Ocupação por orientação em cada ponto da grelha → penaliza cruzamentos
  const hOcc = new Uint16Array(nx * ny)
  const vOcc = new Uint16Array(nx * ny)

  function nodeOf(n) { return { x: round(n.x), y: round(n.y) } }

  // Ponto de saída/entrada: coluna do nó × primeira linha-corredor fora da caixa.
  function stubPoint(n, goingDown) {
    const ix = xi.get(round(n.x))
    if (ix == null) return null
    // arranca a partir da fronteira da caixa (já fora do "padding"), senão a
    // própria caixa do nó bloqueia o stub.
    const edgeY = goingDown ? n.y + H / 2 + PAD : n.y - H / 2 - PAD
    if (goingDown) {
      for (let iy = 0; iy < ny; iy++) if (ys[iy] > edgeY + 0.1 && valid[id(ix, iy)] && !vBlocked(xs[ix], edgeY, ys[iy], boxes)) return { ix, iy }
    } else {
      for (let iy = ny - 1; iy >= 0; iy--) if (ys[iy] < edgeY - 0.1 && valid[id(ix, iy)] && !vBlocked(xs[ix], edgeY, ys[iy], boxes)) return { ix, iy }
    }
    return null
  }

  function route(s, t) {
    const down = t.y >= s.y
    const sp = stubPoint(s, down)
    const tp = stubPoint(t, !down)
    if (!sp || !tp) return null
    const start = id(sp.ix, sp.iy)
    const goal = id(tp.ix, tp.iy)
    const gx = tp.ix, gy = tp.iy

    const dist = new Float64Array(nx * ny).fill(Infinity)
    const prev = new Int32Array(nx * ny).fill(-1)
    const prevDir = new Int8Array(nx * ny).fill(-1)
    const heap = new Heap()
    const h = (ix, iy) => (Math.abs(ix - gx) + Math.abs(iy - gy)) // admissível-ish em passos
    dist[start] = 0
    heap.push({ id: start, dir: -1, g: 0, f: 0 })
    while (heap.size) {
      const cur = heap.pop()
      if (cur.id === goal) break
      if (cur.g > dist[cur.id]) continue
      for (const e of neigh[cur.id]) {
        let ng = cur.g + e.len
        if (cur.dir !== -1 && cur.dir !== e.dir) ng += cfg.TURN
        const a = cur.id, b = e.to
        if (used.has(segKey(a, b))) ng += cfg.OVERLAP
        // cruzar perpendicularmente uma linha já existente é penalizado
        if (e.dir === 0 && vOcc[b]) ng += cfg.CROSS
        if (e.dir === 1 && hOcc[b]) ng += cfg.CROSS
        if (ng < dist[b]) {
          dist[b] = ng; prev[b] = a; prevDir[b] = e.dir
          const iy = b % ny, ix = (b - iy) / ny
          heap.push({ id: b, dir: e.dir, g: ng, f: ng + h(ix, iy) })
        }
      }
    }
    if (prev[goal] === -1 && goal !== start) return null

    // Reconstrói e marca segmentos usados.
    const path = []
    let c = goal
    while (c !== -1) {
      const iy = c % ny, ix = (c - iy) / ny
      path.unshift([xs[ix], ys[iy]])
      if (c === start) break
      const p = prev[c]
      used.add(segKey(c, p))
      // marca ocupação por orientação nas duas pontas do segmento
      if (prevDir[c] === 0) { hOcc[c]++; hOcc[p]++ } else { vOcc[c]++; vOcc[p]++ }
      c = p
    }
    // Junta os "stubs" (aresta da caixa) nas pontas.
    const full = [[s.x, down ? s.y + H / 2 : s.y - H / 2], ...path, [t.x, down ? t.y - H / 2 : t.y + H / 2]]
    return simplify(full)
  }

  return { route, nodeOf, xs, ys, boxes }
}

// Remove pontos colineares consecutivos.
function simplify(pts) {
  const out = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = out[out.length - 1]
    const [bx, by] = pts[i]
    const [cx, cy] = pts[i + 1]
    const col = (Math.abs(ax - bx) < 0.5 && Math.abs(bx - cx) < 0.5) || (Math.abs(ay - by) < 0.5 && Math.abs(by - cy) < 0.5)
    if (!col) out.push(pts[i])
  }
  out.push(pts[pts.length - 1])
  return out
}

/** Encaminha todas as ligações. edges: [{parent, child, primary}]. Devolve
 *  [{parent, child, primary, points}]. Ordena por comprimento (curtas primeiro). */
export function routeAll(nodesById, edges, cfg = ROUTE_CFG) {
  const r = buildRouter(nodesById, cfg)
  const enriched = edges
    .map((e) => ({ ...e, s: nodesById.get(e.parent), t: nodesById.get(e.child) }))
    .filter((e) => e.s && e.t)
    .map((e) => ({ ...e, span: Math.abs(e.s.x - e.t.x) + Math.abs(e.s.y - e.t.y) }))
    .sort((a, b) => a.span - b.span)
  const out = []
  for (const e of enriched) {
    const points = r.route(e.s, e.t)
    out.push({ parent: e.parent, child: e.child, primary: e.primary, points })
  }
  return { routes: out, boxes: r.boxes }
}
