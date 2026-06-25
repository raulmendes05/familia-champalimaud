// Gera src/data/layout.js a partir das posições (nomes) e linhas (conectores)
// extraídas do PDF. Corre: node scripts/generate_layout.mjs
import fs from 'fs'

const pos = JSON.parse(fs.readFileSync('scratch_pos.json')).pos
const lj = JSON.parse(fs.readFileSync('scratch_lines.json'))
const PAGE = { w: lj.w, h: lj.h }

const hex = (s) => {
  const c = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
  return '#' + c(s[0]) + c(s[1]) + c(s[2])
}
const isConnector = (s) => {
  if (!s) return false
  const [r, g, b] = s
  if (r === 0 && g === 0 && b === 0) return false           // preto: molduras de foto
  if (r > 0.95 && g > 0.95 && b > 0.95) return false         // branco
  if (Math.abs(r - 0.86) < 0.06 && Math.abs(g - 0.69) < 0.06) return false // dourado: banner
  return true
}
const lines = lj.lines
  .filter((l) => isConnector(l.stroke))
  .map((l) => ({ p: l.pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]), c: hex(l.stroke) }))

// escala mínima para caixas não sobreporem (assumindo NODE 132x46 no layout fixo)
const W = 132, H = 46
const ids = Object.keys(pos)
let need = 1
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const a = pos[ids[i]], b = pos[ids[j]]
  const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1])
  if (dx > 0.5 && dy * 1 < H) need = Math.max(need, W / dx)
}
const SCALE = Math.ceil((need + 0.15) * 100) / 100

const body = `// ╔══════════════════════════════════════════════════════════════╗
// ║  Layout FIXO — extraído do PDF "CHAMPI - FINAL ASR" (réplica)    ║
// ╚══════════════════════════════════════════════════════════════╝
// GERADO por scripts/generate_layout.mjs a partir do PDF.
// POSITIONS: posição (x,y) de cada membro (coordenadas do PDF).
// LINES: os conectores REAIS desenhados no PDF (já sem cruzamentos).
// Tudo no mesmo referencial → multiplicar por SCALE alinha nós e linhas.

export const PAGE = ${JSON.stringify(PAGE)}
export const SCALE = ${SCALE}
export const NODE = { W: ${W}, H: ${H} }

export const POSITIONS = {
${ids.map((id) => `  ${id}: [${pos[id][0]}, ${pos[id][1]}],`).join('\n')}
}

// Conectores reais do PDF: { p: [[x,y],...], c: cor }
export const LINES = ${JSON.stringify(lines)}
`

fs.writeFileSync('src/data/layout.js', body)
console.log('layout.js gerado:', ids.length, 'posições,', lines.length, 'linhas | SCALE =', SCALE)
