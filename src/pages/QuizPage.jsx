import { useEffect, useMemo, useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import { founderOf } from '../utils/tree'
import { FOUNDER_ORDER } from '../data/founders'
import { eliminationMap } from '../data/roleta'

const VERT = new Set(['padrinho', 'madrinha'])

// ── helpers aleatórios ──
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
/** n distratores distintos (por chave) diferentes do sujeito. */
function distractors(pool, subject, keyFn, n) {
  const used = new Set([keyFn(subject)])
  const out = []
  for (const m of shuffle(pool)) {
    if (m.id === subject.id) continue
    const k = keyFn(m)
    if (used.has(k)) continue
    used.add(k)
    out.push(m)
    if (out.length === n) break
  }
  return out
}

// ── geradores de perguntas ──  (devolvem null se não dá para construir)
const GENERATORS = [
  // 1) alcunha → quem é
  (d) => {
    const pool = d.withNick
    if (pool.length < 4) return null
    const subject = pick(pool)
    const dist = distractors(pool, subject, (m) => m.name, 3)
    if (dist.length < 3) return null
    const opts = shuffle([subject, ...dist])
    return {
      prompt: 'Quem tem esta alcunha?',
      big: `“${subject.nickname}”`,
      options: opts.map((m) => m.name),
      answer: opts.indexOf(subject),
    }
  },
  // 2) membro → alcunha
  (d) => {
    const pool = d.withNick
    if (pool.length < 4) return null
    const subject = pick(pool)
    const dist = distractors(pool, subject, (m) => m.nickname, 3)
    if (dist.length < 3) return null
    const opts = shuffle([subject, ...dist])
    return {
      prompt: `Qual é a alcunha de ${subject.name}?`,
      subject,
      options: opts.map((m) => `“${m.nickname}”`),
      answer: opts.indexOf(subject),
    }
  },
  // 3) padrinho/madrinha de X
  (d) => {
    const kids = d.members.filter((m) => d.primaryParent.has(m.id))
    if (kids.length < 1) return null
    const subject = pick(kids)
    const parent = d.byId.get(d.primaryParent.get(subject.id))
    if (!parent) return null
    const pool = d.members.filter((m) => m.id !== subject.id)
    const dist = distractors(pool, parent, (m) => m.name, 3)
    if (dist.length < 3) return null
    const opts = shuffle([parent, ...dist])
    return {
      prompt: `Quem é o padrinho/madrinha de ${subject.name}?`,
      subject,
      options: opts.map((m) => m.name),
      answer: opts.indexOf(parent),
    }
  },
  // 4) quantos afilhados diretos
  (d) => {
    const withKids = d.members.filter((m) => (d.afilhados.get(m.id) || 0) > 0)
    if (!withKids.length) return null
    const subject = pick(withKids)
    const count = d.afilhados.get(subject.id)
    const set = new Set([count])
    let guard = 0
    while (set.size < 4 && guard++ < 60) {
      const v = count + pick([-3, -2, -1, 1, 2, 3])
      if (v >= 0) set.add(v)
    }
    const opts = shuffle([...set])
    return {
      prompt: `Quantos afilhados diretos tem ${subject.name}?`,
      subject,
      options: opts.map(String),
      answer: opts.indexOf(count),
    }
  },
  // 5) geração
  (d) => {
    const pool = d.members.filter((m) => m.generation > 0)
    if (pool.length < 1) return null
    const subject = pick(pool)
    const allGens = [...new Set(d.members.map((m) => m.generation).filter(Boolean))]
    const others = shuffle(allGens.filter((g) => g !== subject.generation)).slice(0, 3)
    if (others.length < 3) return null
    const opts = shuffle([subject.generation, ...others])
    return {
      prompt: `De que geração é ${subject.name}?`,
      subject,
      options: opts.map((g) => `Geração ${g}`),
      answer: opts.indexOf(subject.generation),
    }
  },
  // 6) linhagem (fundador)
  (d) => {
    const pool = d.members.filter((m) => !FOUNDER_ORDER.includes(m.id))
    if (pool.length < 1) return null
    const subject = pick(pool)
    const fId = founderOf(subject.id, d.relationships)
    if (!fId || !d.byId.has(fId)) return null
    const opts = shuffle(FOUNDER_ORDER)
    return {
      prompt: `De que linhagem é ${subject.name}?`,
      subject,
      options: opts.map((id) => d.byId.get(id)?.name || id),
      answer: opts.indexOf(fId),
    }
  },
  // 7) quem caiu mais cedo na roleta
  (d) => {
    const elim = [...d.elimMap.entries()].filter(([id]) => d.byId.has(id))
    if (elim.length < 4) return null
    const four = shuffle(elim).slice(0, 4)
    const earliest = four.reduce((a, b) => (a[1] < b[1] ? a : b))
    return {
      prompt: 'Quem caiu MAIS CEDO na roleta?',
      options: four.map(([id]) => d.byId.get(id)?.name || id),
      answer: four.indexOf(earliest),
    }
  },
]

function makeQuestion(d) {
  for (let i = 0; i < 25; i++) {
    const q = pick(GENERATORS)(d)
    if (q) return q
  }
  return null
}

export default function QuizPage() {
  const { members, relationships } = useMembers()

  const data = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m]))
    const withNick = members.filter((m) => m.nickname && m.nickname.trim())
    const primaryParent = new Map()
    for (const r of relationships)
      if (VERT.has(r.type) && r.is_primary && !primaryParent.has(r.child_id))
        primaryParent.set(r.child_id, r.parent_id)
    for (const r of relationships)
      if (VERT.has(r.type) && !primaryParent.has(r.child_id))
        primaryParent.set(r.child_id, r.parent_id)
    const kidsOf = new Map()
    for (const r of relationships) {
      if (!VERT.has(r.type)) continue
      if (!kidsOf.has(r.parent_id)) kidsOf.set(r.parent_id, new Set())
      kidsOf.get(r.parent_id).add(r.child_id)
    }
    const afilhados = new Map([...kidsOf].map(([k, s]) => [k, s.size]))
    return { members, relationships, byId, withNick, primaryParent, afilhados, elimMap: eliminationMap() }
  }, [members, relationships])

  const LIMIT = 10
  const [mode, setMode] = useState('livre') // 'livre' | 'desafio'
  const [finished, setFinished] = useState(false)
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)

  const resetGame = (newMode) => {
    setMode(newMode)
    setScore(0)
    setRound(0)
    setStreak(0)
    setBest(0)
    setSelected(null)
    setFinished(false)
    setQuestion(makeQuestion(data))
  }

  // primeira pergunta assim que os dados estão prontos
  useEffect(() => {
    if (!question && members.length) setQuestion(makeQuestion(data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, data])

  const choose = (i) => {
    if (selected !== null || !question) return
    setSelected(i)
    setRound((r) => r + 1)
    if (i === question.answer) {
      setScore((s) => s + 1)
      setStreak((st) => {
        const n = st + 1
        setBest((b) => Math.max(b, n))
        return n
      })
    } else {
      setStreak(0)
    }
  }

  const next = () => {
    if (mode === 'desafio' && round >= LIMIT) {
      setFinished(true)
      return
    }
    setSelected(null)
    setQuestion(makeQuestion(data))
  }

  const share = async () => {
    const url = window.location.origin + '/quiz'
    const text = `Fiz ${score}/${LIMIT} no Quiz Champi 🧠 Tenta bater-me!`
    try {
      if (navigator.share) await navigator.share({ title: 'Quiz Champi', text, url })
      else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        alert('Resultado copiado para a área de transferência!')
      }
    } catch {
      /* utilizador cancelou */
    }
  }

  if (!question) {
    return (
      <div className="grid h-full place-items-center text-sm text-champi-text-dim">
        A preparar o quiz…
      </div>
    )
  }

  const answered = selected !== null
  const correct = answered && selected === question.answer

  // Ecrã final do modo desafio
  if (finished) {
    const pct = Math.round((score / LIMIT) * 100)
    const verdict =
      pct >= 90 ? '🏆 Lenda da Champi!' : pct >= 60 ? '👏 Nada mau!' : pct >= 30 ? '🙂 Dá para melhorar.' : '😬 Vê lá se estudas a árvore!'
    return (
      <div className="mx-auto grid h-full w-full max-w-2xl place-items-center p-6">
        <div className="card animate-fade-in w-full p-8 text-center">
          <p className="text-sm uppercase tracking-wide text-champi-text-dim">Resultado</p>
          <p className="my-2 font-display text-6xl font-bold text-champi-gold">
            {score}/{LIMIT}
          </p>
          <p className="text-lg text-champi-text">{verdict}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => resetGame('desafio')} className="btn-ghost">
              🔁 Jogar outra vez
            </button>
            <button onClick={share} className="btn-gold">
              📤 Partilhar resultado
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-champi-gold">🧠 Quiz Champi</h1>
          <p className="mt-1 text-sm text-champi-text-dim">
            Quão bem conheces a família? Acertas na alcunha, no padrinho, na geração…?
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-champi-line bg-champi-ink-2/80 p-1.5">
          <ModeBtn active={mode === 'livre'} onClick={() => resetGame('livre')}>
            ∞ Livre
          </ModeBtn>
          <ModeBtn active={mode === 'desafio'} onClick={() => resetGame('desafio')}>
            🎯 Desafio (10)
          </ModeBtn>
        </div>
      </div>

      {/* Placar */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Score value={`${score}/${round}`} label="Pontos" />
        {mode === 'desafio' ? (
          <Score value={`${Math.min(round + (answered ? 0 : 1), LIMIT)}/${LIMIT}`} label="Pergunta" tone="gold" />
        ) : (
          <Score value={streak} label="Seguidos" tone="gold" />
        )}
        <Score value={best} label="Recorde" />
      </div>

      {/* Pergunta */}
      <div className="card animate-fade-in p-5">
        <p className="text-base font-medium text-champi-text">{question.prompt}</p>

        {question.subject && (
          <div className="mt-3 flex items-center gap-3">
            <Avatar member={question.subject} />
            <span className="font-display text-xl font-semibold text-champi-gold">
              {question.subject.name}
            </span>
          </div>
        )}

        {question.big && (
          <p className="mt-3 border-l-2 border-champi-gold/70 pl-3 font-display text-2xl italic text-champi-text">
            {question.big}
          </p>
        )}

        {/* Opções */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {question.options.map((opt, i) => {
            const isAnswer = i === question.answer
            const isChosen = i === selected
            let cls =
              'border-champi-line bg-champi-ink-3/60 text-champi-text hover:border-champi-gold/60'
            if (answered) {
              if (isAnswer) cls = 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
              else if (isChosen) cls = 'border-red-500 bg-red-500/15 text-red-300'
              else cls = 'border-champi-line bg-champi-ink-3/40 text-champi-text-dim opacity-70'
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${cls}`}
              >
                <span>{opt}</span>
                {answered && isAnswer && <span>✓</span>}
                {answered && isChosen && !isAnswer && <span>✕</span>}
              </button>
            )
          })}
        </div>

        {/* Feedback + próxima */}
        {answered && (
          <div className="mt-5 flex items-center justify-between">
            <p className={`text-sm font-semibold ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
              {correct ? '🎉 Certo!' : '❌ Falhaste essa.'}
            </p>
            <button onClick={next} className="btn-gold">
              {mode === 'desafio' && round >= LIMIT ? 'Ver resultado →' : 'Próxima →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-champi-gold text-champi-ink' : 'text-champi-text-dim hover:text-champi-text'
      }`}
    >
      {children}
    </button>
  )
}

function Score({ value, label, tone }) {
  return (
    <div className="card p-3 text-center">
      <p className={`text-2xl font-bold ${tone === 'gold' ? 'text-champi-gold' : 'text-champi-text'}`}>
        {value}
      </p>
      <p className="text-xs text-champi-text-dim">{label}</p>
    </div>
  )
}

function Avatar({ member }) {
  const photo = member?.photo_url
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-champi-gold/60 bg-champi-ink text-lg font-bold text-champi-gold">
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (member?.name || '?').charAt(0)
      )}
    </div>
  )
}
