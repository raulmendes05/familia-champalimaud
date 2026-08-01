import { useEffect, useMemo, useRef, useState } from 'react'
import { createPinball, W, H } from '../utils/pinball'
import { useMembers } from '../hooks/useMembers'

const HI_KEY = 'champi_pinball_hi'

const readHi = () => {
  const n = Number(localStorage.getItem(HI_KEY))
  return Number.isFinite(n) ? n : 0
}

export default function PinballPage() {
  const { members } = useMembers()
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const [hud, setHud] = useState({
    phase: 'ready',
    score: 0,
    balls: 3,
    mult: 1,
    hi: 0,
    message: '',
    msgId: 0,
  })
  const [muted, setMuted] = useState(false)

  // 3 nomes da família para os bumpers (muda a cada visita).
  const labels = useMemo(() => {
    if (!members.length) return []
    const pool = [...members]
    const out = []
    while (out.length < 3 && pool.length) {
      const [m] = pool.splice(Math.floor(Math.random() * pool.length), 1)
      const name = (m.nickname || m.name || '').split(' ')[0]
      if (name && name.length <= 9) out.push(name)
    }
    return out
  }, [members])

  // ── motor ──
  useEffect(() => {
    const engine = createPinball(canvasRef.current, {
      hiScore: readHi(),
      onEvent: setHud,
    })
    engineRef.current = engine
    if (import.meta.env.DEV) window.__pinball = engine

    const fit = () => {
      const el = wrapRef.current
      if (!el) return
      const s = Math.min(el.clientWidth / W, el.clientHeight / H)
      engine.resize(Math.floor(W * s), Math.floor(H * s))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrapRef.current)

    const keyMap = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', l: 'right', L: 'right', d: 'right', D: 'right',
      ' ': 'plunger', ArrowDown: 'plunger', Enter: 'plunger',
    }
    const down = (e) => {
      const action = keyMap[e.key]
      if (!action) return
      e.preventDefault()
      if (!e.repeat) engine.press(action)
    }
    const up = (e) => {
      const action = keyMap[e.key]
      if (!action) return
      e.preventDefault()
      engine.release(action)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      ro.disconnect()
      localStorage.setItem(HI_KEY, String(engine.getHi()))
      engine.destroy()
    }
  }, [])

  useEffect(() => {
    if (labels.length) engineRef.current?.setLabels(labels)
  }, [labels])

  useEffect(() => {
    engineRef.current?.setMuted(muted)
  }, [muted])

  // Guarda o recorde assim que sobe (não só ao sair da página).
  useEffect(() => {
    if (hud.hi > readHi()) localStorage.setItem(HI_KEY, String(hud.hi))
  }, [hud.hi])

  // ── toque: metade esquerda / direita do tabuleiro aciona os flippers ──
  const touch = (kind) => (e) => {
    e.preventDefault()
    const engine = engineRef.current
    if (!engine) return
    const rect = canvasRef.current.getBoundingClientRect()
    const side = e.clientX - rect.left < rect.width / 2 ? 'left' : 'right'
    if (kind === 'down') engine.press(side)
    else engine.release(side)
  }

  const hold = (action) => ({
    onPointerDown: (e) => { e.preventDefault(); engineRef.current?.press(action) },
    onPointerUp: (e) => { e.preventDefault(); engineRef.current?.release(action) },
    onPointerLeave: () => engineRef.current?.release(action),
  })

  return (
    <div className="flex h-full flex-col items-center gap-2 overflow-hidden px-3 py-2">
      {/* HUD */}
      <div className="flex w-full max-w-md items-center justify-between gap-2 text-center">
        <Stat label="Pontos" value={hud.score.toLocaleString('pt-PT')} gold />
        <Stat label="Multi" value={`×${hud.mult}`} />
        <Stat label="Bolas" value={'●'.repeat(hud.balls) || '—'} />
        <Stat label="Recorde" value={hud.hi.toLocaleString('pt-PT')} />
        <button
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Ligar som' : 'Desligar som'}
          className="rounded-lg border border-champi-line px-2.5 py-1.5 text-sm text-champi-text-dim hover:text-champi-text"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Tabuleiro */}
      <div ref={wrapRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onPointerDown={touch('down')}
            onPointerUp={touch('up')}
            onPointerCancel={touch('up')}
            className="block touch-none rounded-2xl ring-1 ring-champi-line shadow-glow"
          />

          {hud.phase === 'over' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-champi-ink/80 backdrop-blur-sm">
              <div className="animate-fade-in rounded-2xl border border-champi-line bg-champi-panel px-8 py-6 text-center shadow-glow">
                <p className="font-display text-3xl font-semibold text-champi-gold">Fim de jogo</p>
                <p className="mt-2 text-4xl font-bold text-champi-text">
                  {hud.score.toLocaleString('pt-PT')}
                </p>
                <p className="mt-1 text-sm text-champi-text-dim">
                  {hud.score >= hud.hi ? '🏆 Novo recorde!' : `Recorde: ${hud.hi.toLocaleString('pt-PT')}`}
                </p>
                <button
                  onClick={() => engineRef.current?.newGame()}
                  className="mt-5 rounded-xl bg-champi-gold px-6 py-2.5 font-semibold text-champi-ink transition hover:bg-champi-gold-soft"
                >
                  Jogar outra vez
                </button>
              </div>
            </div>
          )}

          {hud.phase !== 'over' && hud.message && (
            <div
              key={hud.msgId}
              className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto w-fit animate-fade-in rounded-full border border-champi-line bg-champi-ink-2/90 px-4 py-1.5 text-sm text-champi-text"
            >
              {hud.message}
            </div>
          )}
        </div>
      </div>

      {/* Controlos */}
      <div className="flex w-full max-w-md items-center justify-center gap-2">
        <button
          {...hold('left')}
          className="flex-1 touch-none select-none rounded-xl border border-champi-line bg-champi-ink-3 py-3 text-lg font-bold text-champi-gold active:bg-champi-purple-deep sm:hidden"
        >
          ◀
        </button>
        <button
          {...hold('plunger')}
          className="flex-1 touch-none select-none rounded-xl border border-champi-line bg-champi-ink-3 py-3 text-sm font-semibold text-champi-text active:bg-champi-purple-deep sm:hidden"
        >
          LANÇAR
        </button>
        <button
          {...hold('right')}
          className="flex-1 touch-none select-none rounded-xl border border-champi-line bg-champi-ink-3 py-3 text-lg font-bold text-champi-gold active:bg-champi-purple-deep sm:hidden"
        >
          ▶
        </button>
        <p className="hidden text-center text-xs text-champi-text-dim sm:block">
          <Key>←</Key>/<Key>A</Key> e <Key>→</Key>/<Key>L</Key> flippers · segura{' '}
          <Key>Espaço</Key> para carregar o lançador · bumpers ×{hud.mult} · derruba
          <span className="text-champi-gold"> C·H·I </span>
          para subir o multiplicador
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, gold }) {
  return (
    <div className="flex-1 rounded-xl border border-champi-line bg-champi-ink-2/70 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-champi-text-dim">{label}</p>
      <p
        className={`truncate text-base font-semibold tabular-nums ${
          gold ? 'text-champi-gold' : 'text-champi-text'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

const Key = ({ children }) => (
  <kbd className="rounded border border-champi-line bg-champi-ink-3 px-1.5 py-0.5 text-[11px] text-champi-text">
    {children}
  </kbd>
)
