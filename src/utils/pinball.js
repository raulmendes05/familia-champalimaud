// Motor de pinball — física própria (sem libs) + desenho em canvas 2D.
//
// A mesa vive em coordenadas lógicas W×H; o canvas é escalado para caber no ecrã.
// O passo de física é fixo (1/240 s) para a bola nunca atravessar paredes finas.

export const W = 440
export const H = 760

const R = 9            // raio da bola
const SUB = 1 / 240    // passo fixo de física
const GRAV = 1500      // "inclinação" da mesa
const MAX_V = 1700
const FLIP_R = 7       // raio da cápsula do flipper
const FLIP_L = 62      // comprimento do flipper

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
const rad = (deg) => (deg * Math.PI) / 180

// ─────────────────────────── mesa ───────────────────────────

function buildTable() {
  // Paredes retas: {a, b, e, kick}
  const wall = (ax, ay, bx, by, e = 0.42) => ({ a: [ax, ay], b: [bx, by], e, kick: 0 })

  const walls = [
    wall(20, 220, 20, 540),      // parede esquerda
    wall(20, 540, 112, 626),     // rampa esquerda (inlane)
    wall(112, 626, 120, 640),
    wall(420, 220, 420, 730),    // parede exterior direita (canal do lançador)
    wall(380, 250, 380, 540),    // divisória do canal
    wall(380, 540, 288, 626),    // rampa direita
    wall(288, 626, 280, 640),
    wall(380, 730, 420, 730),    // chão do canal (a bola espera aqui)
  ]

  // Slingshots: triângulos que dão pontapé. O lado a→b está virado para o jogo.
  // As costas ficam afastadas da rampa o suficiente para a bola descer o corredor
  // sem encravar na cunha (canal ≥ 29px para uma bola de 18px).
  const slings = [
    { a: [54, 436], b: [120, 570], anchor: [54, 532], e: 0.4, kick: 400, flash: 0 },
    { a: [346, 436], b: [280, 570], anchor: [346, 532], e: 0.4, kick: 400, flash: 0 },
  ]
  // As costas dos slingshots também são sólidas.
  for (const s of slings) {
    walls.push(wall(s.a[0], s.a[1], s.anchor[0], s.anchor[1], 0.3))
    walls.push(wall(s.anchor[0], s.anchor[1], s.b[0], s.b[1], 0.3))
  }

  const bumpers = [
    { x: 150, y: 262, r: 24, label: 'CHAMPI', flash: 0 },
    { x: 220, y: 200, r: 24, label: 'PRAXE', flash: 0 },
    { x: 290, y: 262, r: 24, label: 'FAMÍLIA', flash: 0 },
  ]

  const posts = [
    { x: 120, y: 430, r: 9 },
    { x: 300, y: 430, r: 9 },
  ]

  // Dois bancos de alvos (C-H-I): derrubar os 3 dá bónus e sobe o multiplicador.
  const targets = [
    { a: [48, 300], b: [80, 288], label: 'C', bank: 0, down: false, flash: 0 },
    { a: [48, 342], b: [80, 330], label: 'H', bank: 0, down: false, flash: 0 },
    { a: [48, 384], b: [80, 372], label: 'I', bank: 0, down: false, flash: 0 },
    { a: [352, 300], b: [320, 288], label: 'C', bank: 1, down: false, flash: 0 },
    { a: [352, 342], b: [320, 330], label: 'H', bank: 1, down: false, flash: 0 },
    { a: [352, 384], b: [320, 372], label: 'I', bank: 1, down: false, flash: 0 },
  ]

  const flippers = [
    { side: 'left', px: 126, py: 644, rest: rad(30), up: rad(-26), angle: rad(30), omega: 0, pressed: false },
    { side: 'right', px: 274, py: 644, rest: rad(150), up: rad(206), angle: rad(150), omega: 0, pressed: false },
  ]

  // Arco superior (metade de cima de um círculo) — a bola lançada curva para o jogo.
  const arc = { cx: 220, cy: 220, r: 200, e: 0.42 }

  return { walls, slings, bumpers, posts, targets, flippers, arc }
}

// ───────────────────────── colisões ─────────────────────────

function closestOnSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const len2 = abx * abx + aby * aby || 1
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / len2, 0, 1)
  return [ax + abx * t, ay + aby * t]
}

/**
 * Resolve a bola contra um ponto de contacto (parede, bumper ou flipper).
 * `sv` é a velocidade da superfície nesse ponto (só os flippers a têm).
 * Devolve a velocidade de impacto (>0) ou 0 se não houve toque.
 */
function resolve(ball, qx, qy, radius, e, kick, svx = 0, svy = 0) {
  let dx = ball.x - qx
  let dy = ball.y - qy
  let d = Math.hypot(dx, dy)
  if (d > radius) return 0
  if (d < 0.0001) { dx = 0; dy = -1; d = 1 }
  const nx = dx / d
  const ny = dy / d
  ball.x = qx + nx * radius
  ball.y = qy + ny * radius

  const vn = (ball.vx - svx) * nx + (ball.vy - svy) * ny
  let impact = 0
  if (vn < 0) {
    impact = -vn
    const j = -(1 + e) * vn
    ball.vx += nx * j
    ball.vy += ny * j
    // atrito tangencial leve (a bola "agarra" um pouco à superfície)
    const tx = -ny
    const ty = nx
    const vt = (ball.vx - svx) * tx + (ball.vy - svy) * ty
    ball.vx -= tx * vt * 0.08
    ball.vy -= ty * vt * 0.08
  }
  if (kick) {
    ball.vx += nx * kick
    ball.vy += ny * kick
    impact = Math.max(impact, kick)
  }
  return impact
}

// ───────────────────────── som ─────────────────────────

function makeAudio() {
  let ac = null
  let muted = false
  return {
    resume() {
      if (muted) return
      if (!ac) {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (Ctx) ac = new Ctx()
      }
      if (ac && ac.state === 'suspended') ac.resume()
    },
    setMuted(v) { muted = v },
    blip(freq, dur = 0.07, type = 'square', vol = 0.05) {
      if (muted || !ac || ac.state !== 'running') return
      const t = ac.currentTime
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, t)
      g.gain.setValueAtTime(vol, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g)
      g.connect(ac.destination)
      o.start(t)
      o.stop(t + dur)
    },
    sweep(from, to, dur = 0.4, vol = 0.05) {
      if (muted || !ac || ac.state !== 'running') return
      const t = ac.currentTime
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(from, t)
      o.frequency.exponentialRampToValueAtTime(to, t + dur)
      g.gain.setValueAtTime(vol, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g)
      g.connect(ac.destination)
      o.start(t)
      o.stop(t + dur)
    },
  }
}

// ───────────────────────── motor ─────────────────────────

export function createPinball(canvas, { onEvent = () => {}, hiScore = 0 } = {}) {
  const ctx = canvas.getContext('2d')
  const table = buildTable()
  const audio = makeAudio()

  const ball = { x: 400, y: 712, vx: 0, vy: 0, trail: [] }
  const pops = []      // pontuações a flutuar
  const sparks = []

  const state = {
    phase: 'ready',    // ready | play | over
    score: 0,
    balls: 3,
    mult: 1,
    hi: hiScore,
    message: 'Puxa o lançador para começar',
    msgId: 0,
    charge: 0,
    charging: false,
  }

  let raf = 0
  let last = 0
  let acc = 0
  let scale = 1
  let stuck = 0      // tempo que a bola leva quase parada (vigia de encravamento)

  const emit = () =>
    onEvent({
      phase: state.phase,
      score: state.score,
      balls: state.balls,
      mult: state.mult,
      hi: state.hi,
      message: state.message,
      msgId: state.msgId,
    })

  function say(text) {
    state.message = text
    state.msgId++
    emit()
  }

  function addScore(n, x, y, label) {
    const gained = n * state.mult
    state.score += gained
    if (state.score > state.hi) state.hi = state.score
    if (x != null) pops.push({ x, y, text: `${label ? label + ' ' : ''}+${gained}`, life: 1 })
    emit()
  }

  function spark(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 60 + Math.random() * 160
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 })
    }
  }

  function parkBall() {
    ball.x = 400
    ball.y = 712
    ball.vx = 0
    ball.vy = 0
    ball.trail.length = 0
    state.charge = 0
    state.charging = false
  }

  function resetTargets() {
    for (const t of table.targets) t.down = false
  }

  function newGame() {
    state.score = 0
    state.balls = 3
    state.mult = 1
    state.phase = 'ready'
    resetTargets()
    parkBall()
    say('Puxa o lançador para começar')
  }

  const inLane = () => ball.x > 380 && ball.y > 560

  function launch() {
    const power = 700 + 900 * state.charge
    ball.vy = -power
    ball.vx = (Math.random() - 0.5) * 30
    state.charge = 0
    state.charging = false
    state.phase = 'play'
    audio.sweep(180, 900, 0.25, 0.06)
    say('')
  }

  function drain() {
    state.balls -= 1
    audio.sweep(400, 60, 0.5, 0.07)
    resetTargets()
    parkBall()
    if (state.balls <= 0) {
      state.balls = 0
      state.phase = 'over'
      say('Fim de jogo')
    } else {
      state.phase = 'ready'
      say(state.balls === 1 ? 'Última bola!' : 'Bola perdida — lança a próxima')
    }
    emit()
  }

  // ── passo de física ──
  function step(dt) {
    // flippers
    for (const f of table.flippers) {
      const target = f.pressed ? f.up : f.rest
      const speed = 26 // rad/s
      const prev = f.angle
      if (f.angle < target) f.angle = Math.min(target, f.angle + speed * dt)
      else f.angle = Math.max(target, f.angle - speed * dt)
      f.omega = (f.angle - prev) / dt
    }

    if (state.phase === 'over') return

    // lançador: enquanto carrega, a bola fica presa em baixo
    if (state.charging && inLane()) {
      state.charge = Math.min(1, state.charge + dt / 1.1)
      ball.vy = 0
      ball.vx = 0
      ball.y = 712 + state.charge * 16
      return
    }

    ball.vy += GRAV * dt
    ball.vx *= 0.9996
    ball.vy *= 0.9996
    const sp = Math.hypot(ball.vx, ball.vy)
    if (sp > MAX_V) {
      ball.vx = (ball.vx / sp) * MAX_V
      ball.vy = (ball.vy / sp) * MAX_V
    }
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt

    // paredes retas
    for (const w of table.walls) {
      const [qx, qy] = closestOnSeg(ball.x, ball.y, w.a[0], w.a[1], w.b[0], w.b[1])
      const hit = resolve(ball, qx, qy, R, w.e, 0)
      if (hit > 260) audio.blip(120 + Math.random() * 40, 0.04, 'triangle', 0.02)
    }

    // arco superior (contenção pelo interior, metade de cima)
    {
      const a = table.arc
      const dx = ball.x - a.cx
      const dy = ball.y - a.cy
      const d = Math.hypot(dx, dy)
      if (dy <= 0 && d > a.r - R) {
        const nx = dx / (d || 1)
        const ny = dy / (d || 1)
        ball.x = a.cx + nx * (a.r - R)
        ball.y = a.cy + ny * (a.r - R)
        const vn = ball.vx * nx + ball.vy * ny
        if (vn > 0) {
          const j = (1 + a.e) * vn
          ball.vx -= nx * j
          ball.vy -= ny * j
        }
      }
    }

    // postes
    for (const p of table.posts) resolve(ball, p.x, p.y, R + p.r, 0.6, 0)

    // bumpers
    for (const b of table.bumpers) {
      const d = Math.hypot(ball.x - b.x, ball.y - b.y)
      if (d < R + b.r) {
        resolve(ball, b.x, b.y, R + b.r, 0.45, 430)
        b.flash = 1
        spark(b.x, b.y, 10)
        audio.blip(660 + Math.random() * 200, 0.06, 'square', 0.05)
        addScore(100, b.x, b.y - b.r - 6, b.label)
      }
    }

    // slingshots
    for (const s of table.slings) {
      const [qx, qy] = closestOnSeg(ball.x, ball.y, s.a[0], s.a[1], s.b[0], s.b[1])
      if (Math.hypot(ball.x - qx, ball.y - qy) < R) {
        resolve(ball, qx, qy, R, s.e, s.kick)
        s.flash = 1
        spark(qx, qy, 6)
        audio.blip(320, 0.05, 'sawtooth', 0.04)
        addScore(50, qx, qy - 10)
      }
    }

    // alvos
    for (const t of table.targets) {
      if (t.down) continue
      const [qx, qy] = closestOnSeg(ball.x, ball.y, t.a[0], t.a[1], t.b[0], t.b[1])
      if (Math.hypot(ball.x - qx, ball.y - qy) < R + 3) {
        resolve(ball, qx, qy, R + 3, 0.35, 0)
        t.down = true
        t.flash = 1
        spark(qx, qy, 8)
        audio.blip(880, 0.08, 'square', 0.045)
        addScore(250, qx, qy - 12, t.label)
        const bank = table.targets.filter((o) => o.bank === t.bank)
        if (bank.every((o) => o.down)) {
          addScore(1500, (t.a[0] + t.b[0]) / 2, qy - 30, 'BANCO!')
          for (const o of bank) o.down = false
          if (state.mult < 6) {
            state.mult += 1
            say(`Multiplicador ×${state.mult}!`)
          }
          audio.blip(1200, 0.18, 'square', 0.05)
        }
      }
    }

    // flippers (cápsula a rodar em torno do pivô)
    for (const f of table.flippers) {
      const tipX = f.px + Math.cos(f.angle) * FLIP_L
      const tipY = f.py + Math.sin(f.angle) * FLIP_L
      const [qx, qy] = closestOnSeg(ball.x, ball.y, f.px, f.py, tipX, tipY)
      const rx = qx - f.px
      const ry = qy - f.py
      const svx = -f.omega * ry
      const svy = f.omega * rx
      const hit = resolve(ball, qx, qy, R + FLIP_R, 0.4, 0, svx, svy)
      if (hit > 200) audio.blip(200, 0.05, 'triangle', 0.035)
    }

    // Vigia: se a bola encravar num canto, a mesa leva um abanão. Junto aos
    // flippers a bola pode estar "ao colo" de propósito — aí espera-se mais.
    if (state.phase === 'play' && !inLane()) {
      stuck = Math.hypot(ball.vx, ball.vy) < 34 ? stuck + dt : 0
      if (stuck > (ball.y > 580 ? 6 : 2.5)) {
        stuck = 0
        ball.vx += (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 120)
        ball.vy -= 260
        audio.blip(90, 0.12, 'sawtooth', 0.05)
        say('Abanão na mesa!')
      }
    } else {
      stuck = 0
    }

    // dreno
    if (ball.y > H + 40) drain()
  }

  // ───────────────────────── desenho ─────────────────────────

  function drawBoard() {
    // fundo
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#241634')
    g.addColorStop(0.45, '#1a1023')
    g.addColorStop(1, '#140d1c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // brilho roxo no topo do campo
    const glow = ctx.createRadialGradient(220, 230, 20, 220, 230, 250)
    glow.addColorStop(0, 'rgba(124,77,255,0.20)')
    glow.addColorStop(1, 'rgba(124,77,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // arco superior
    ctx.strokeStyle = 'rgba(212,175,55,0.55)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(table.arc.cx, table.arc.cy, table.arc.r, Math.PI, 0)
    ctx.stroke()

    // paredes
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgba(212,175,55,0.5)'
    ctx.lineWidth = 5
    for (const w of table.walls) {
      ctx.beginPath()
      ctx.moveTo(w.a[0], w.a[1])
      ctx.lineTo(w.b[0], w.b[1])
      ctx.stroke()
    }

    // marcas decorativas do campo
    ctx.strokeStyle = 'rgba(169,139,255,0.10)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(220, 430, 120, Math.PI * 0.15, Math.PI * 0.85)
    ctx.stroke()

    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.fillStyle = '#a99cc4'
    ctx.font = '600 11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FAMÍLIA CHAMPALIMAUD', 200, 706)
    ctx.restore()
  }

  function drawSlings() {
    for (const s of table.slings) {
      ctx.beginPath()
      ctx.moveTo(s.a[0], s.a[1])
      ctx.lineTo(s.b[0], s.b[1])
      ctx.lineTo(s.anchor[0], s.anchor[1])
      ctx.closePath()
      ctx.fillStyle = s.flash > 0 ? '#f6e7a8' : '#4a2b8c'
      ctx.fill()
      ctx.strokeStyle = s.flash > 0 ? '#fff' : 'rgba(212,175,55,0.75)'
      ctx.lineWidth = 3
      ctx.stroke()
      s.flash = Math.max(0, s.flash - 0.08)
    }
  }

  function drawTargets() {
    for (const t of table.targets) {
      const mx = (t.a[0] + t.b[0]) / 2
      const my = (t.a[1] + t.b[1]) / 2
      ctx.beginPath()
      ctx.moveTo(t.a[0], t.a[1])
      ctx.lineTo(t.b[0], t.b[1])
      ctx.lineWidth = t.down ? 3 : 9
      ctx.strokeStyle = t.down ? 'rgba(169,139,255,0.25)' : t.flash > 0 ? '#fff' : '#d4af37'
      ctx.stroke()
      if (!t.down) {
        ctx.fillStyle = '#140d1c'
        ctx.font = '700 9px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(t.label, mx, my + 1)
      }
      t.flash = Math.max(0, t.flash - 0.08)
    }
  }

  function drawBumpers() {
    for (const b of table.bumpers) {
      const f = b.flash
      const g = ctx.createRadialGradient(b.x - 6, b.y - 8, 2, b.x, b.y, b.r)
      g.addColorStop(0, f > 0 ? '#ffffff' : '#a98bff')
      g.addColorStop(1, f > 0 ? '#e8c969' : '#4a2b8c')
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = f > 0 ? '#fff' : '#d4af37'
      ctx.stroke()

      ctx.fillStyle = f > 0 ? '#140d1c' : '#ece6f5'
      ctx.font = '700 9px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = b.label.length > 9 ? b.label.slice(0, 9) : b.label
      ctx.fillText(label, b.x, b.y + 1)
      b.flash = Math.max(0, b.flash - 0.1)
    }

    for (const p of table.posts) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = '#3a2a55'
      ctx.fill()
      ctx.strokeStyle = 'rgba(212,175,55,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  function drawFlippers() {
    for (const f of table.flippers) {
      const tipX = f.px + Math.cos(f.angle) * FLIP_L
      const tipY = f.py + Math.sin(f.angle) * FLIP_L
      const g = ctx.createLinearGradient(f.px, f.py, tipX, tipY)
      g.addColorStop(0, '#e8c969')
      g.addColorStop(1, '#9a7d28')
      ctx.lineCap = 'round'
      ctx.lineWidth = FLIP_R * 2
      ctx.strokeStyle = g
      ctx.beginPath()
      ctx.moveTo(f.px, f.py)
      ctx.lineTo(tipX, tipY)
      ctx.stroke()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(20,13,28,0.5)'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(f.px, f.py, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#140d1c'
      ctx.fill()
    }
  }

  function drawPlunger() {
    const compress = state.charge * 22
    ctx.strokeStyle = '#a99cc4'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(400, 726 + compress)
    ctx.lineTo(400, 754)
    ctx.stroke()
    ctx.fillStyle = state.charge > 0 ? '#e8c969' : '#7c4dff'
    ctx.fillRect(388, 720 + compress, 24, 8)

    if (state.charge > 0) {
      ctx.fillStyle = 'rgba(212,175,55,0.85)'
      ctx.fillRect(384, 700 - state.charge * 120, 4, state.charge * 120)
    }
  }

  function drawBall() {
    if (state.phase === 'over') return
    // rasto
    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i]
      ctx.beginPath()
      ctx.arc(t[0], t[1], R * (0.35 + (i / ball.trail.length) * 0.5), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(236,230,245,${0.04 + (i / ball.trail.length) * 0.10})`
      ctx.fill()
    }
    const g = ctx.createRadialGradient(ball.x - 3, ball.y - 4, 1, ball.x, ball.y, R)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.5, '#cfc9dd')
    g.addColorStop(1, '#6b6480')
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()
  }

  function drawFx(dt) {
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]
      p.life -= dt * 1.3
      p.y -= dt * 34
      if (p.life <= 0) { pops.splice(i, 1); continue }
      ctx.globalAlpha = clamp(p.life, 0, 1)
      ctx.fillStyle = '#e8c969'
      ctx.font = '700 12px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.text, p.x, p.y)
      ctx.globalAlpha = 1
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]
      s.life -= dt * 2.4
      s.x += s.vx * dt
      s.y += s.vy * dt
      if (s.life <= 0) { sparks.splice(i, 1); continue }
      ctx.globalAlpha = clamp(s.life, 0, 1)
      ctx.fillStyle = '#ffe9a8'
      ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3)
      ctx.globalAlpha = 1
    }
  }

  function render(dt) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    drawBoard()
    drawTargets()
    drawSlings()
    drawBumpers()
    drawPlunger()
    drawFlippers()
    drawBall()
    drawFx(dt)
  }

  // ───────────────────────── loop ─────────────────────────

  function frame(now) {
    raf = requestAnimationFrame(frame)
    if (!last) last = now
    let dt = (now - last) / 1000
    last = now
    if (dt > 0.1) dt = 0.1
    acc += dt
    let guard = 0
    while (acc >= SUB && guard++ < 16) {
      step(SUB)
      acc -= SUB
    }
    ball.trail.push([ball.x, ball.y])
    if (ball.trail.length > 8) ball.trail.shift()
    render(dt)
  }

  // ───────────────────────── API ─────────────────────────

  function press(action) {
    audio.resume()
    if (action === 'left') table.flippers[0].pressed = true
    else if (action === 'right') table.flippers[1].pressed = true
    else if (action === 'plunger') {
      if (state.phase === 'over') return
      if (inLane()) state.charging = true
    }
  }

  function release(action) {
    if (action === 'left') table.flippers[0].pressed = false
    else if (action === 'right') table.flippers[1].pressed = false
    else if (action === 'plunger' && state.charging) launch()
  }

  function resize(cssW, cssH) {
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    scale = (cssW / W) * dpr
  }

  function setLabels(labels) {
    labels.filter(Boolean).slice(0, 3).forEach((l, i) => {
      if (table.bumpers[i]) table.bumpers[i].label = String(l).toUpperCase()
    })
  }

  raf = requestAnimationFrame(frame)
  emit()

  return {
    press,
    release,
    resize,
    setLabels,
    newGame,
    setMuted: (v) => audio.setMuted(v),
    getHi: () => state.hi,
    // usado só em desenvolvimento (testes de física)
    getBall: () => ({ x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, phase: state.phase }),
    destroy() { cancelAnimationFrame(raf) },
  }
}
