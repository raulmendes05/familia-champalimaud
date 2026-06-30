import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMembers } from '../hooks/useMembers'
import {
  buildAdjacency,
  degreesOfSeparation,
  founderOf,
  relationsOf,
} from '../utils/tree'

// Hash determinístico (FNV-1a) sobre o par ordenado → resultado fixo por casal.
function hashPair(a, b) {
  const s = [a, b].sort().join('::')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const pick = (arr, h) => arr[h % arr.length]

const TIERS = [
  { min: 90, label: 'Almas gémeas', emoji: '💍', color: '#d4af37' },
  { min: 75, label: 'Há química a sério', emoji: '🔥', color: '#e8c969' },
  { min: 55, label: 'Amizade colorida', emoji: '💘', color: '#a98bff' },
  { min: 35, label: 'Só amigos', emoji: '🤝', color: '#7c4dff' },
  { min: 15, label: 'Melhor nem tentar', emoji: '🧊', color: '#6f6a86' },
  { min: 0, label: 'Catástrofe anunciada', emoji: '💀', color: '#d9657a' },
]

const VERDICTS_HIGH = [
  'O grupo já está a tratar do convite de casamento.',
  'Vão acabar a partilhar a mesma alcunha.',
  'Energia de "já namoram e não contaram a ninguém".',
]
const VERDICTS_MID = [
  'Dava um belo par de praxe — o resto logo se vê.',
  'Há potencial, mas alguém tem de dar o primeiro passo.',
  'Boa dupla para sangrias; relação séria... talvez.',
]
const VERDICTS_LOW = [
  'Melhor manterem-se em mesas separadas nos jantares.',
  'Compatíveis como azeite e água com gás.',
  'A própria árvore genealógica está a pedir que não.',
]

const tierFor = (pct) => TIERS.find((t) => pct >= t.min) || TIERS[TIERS.length - 1]

export default function CompatibilidadePage() {
  const { members, relationships } = useMembers()
  const sorted = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  )
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const adj = useMemo(() => buildAdjacency(members, relationships), [members, relationships])
  const [params, setParams] = useSearchParams()
  const [aId, setAId] = useState(params.get('a') || '')
  const [bId, setBId] = useState(params.get('b') || '')
  const [copied, setCopied] = useState(false)

  // Mantém o URL em sincronia com a seleção (link partilhável).
  useEffect(() => {
    const next = {}
    if (aId) next.a = aId
    if (bId) next.b = bId
    setParams(next, { replace: true })
    setCopied(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId, bId])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      /* ignore */
    }
  }

  const result = useMemo(() => {
    if (!aId || !bId || aId === bId) return null
    const a = byId.get(aId)
    const b = byId.get(bId)
    if (!a || !b) return null

    const h = hashPair(aId, bId)
    const pct = h % 101
    const tier = tierFor(pct)

    // Fatores reais da árvore
    const factors = []
    const founderA = founderOf(aId, relationships)
    const sameFounder = founderA && founderA === founderOf(bId, relationships)
    const sameGen = a.generation && a.generation === b.generation

    // relação direta (padrinho/afilhado/irmão)?
    const { padrinhos, afilhados, irmaos } = relationsOf(aId, members, relationships)
    const directIds = new Set([
      ...padrinhos.map((x) => x.member.id),
      ...afilhados.map((x) => x.member.id),
      ...irmaos.map((x) => x.member.id),
    ])

    if (directIds.has(bId)) {
      factors.push({ icon: '🚧', text: 'Já são família direta na praxe — isto é praticamente incesto champi.' })
    }
    if (sameFounder) {
      factors.push({ icon: '🧬', text: `Mesma linhagem (${byId.get(founderA)?.name}) — já são da mesma "família".` })
    }
    if (sameGen) {
      factors.push({ icon: '🎓', text: `Mesma geração (Gen ${a.generation}) — pelo menos partilham as histórias.` })
    } else {
      const diff = Math.abs((a.generation || 0) - (b.generation || 0))
      if (diff >= 2) factors.push({ icon: '⏳', text: `${diff} gerações de diferença — namoro intergeracional.` })
    }

    const sep = degreesOfSeparation(adj, aId, bId)
    if (sep && sep.degree > 0) {
      factors.push({ icon: '🔗', text: `${sep.degree} grau(s) de separação na árvore.` })
    }

    const verdictPool = pct >= 70 ? VERDICTS_HIGH : pct >= 40 ? VERDICTS_MID : VERDICTS_LOW
    const verdict = pick(verdictPool, h)

    return { a, b, pct, tier, factors, verdict }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId, bId, members, relationships, adj])

  const sorteia = () => {
    if (sorted.length < 2) return
    const i = Math.floor(Math.random() * sorted.length)
    let j = Math.floor(Math.random() * sorted.length)
    if (j === i) j = (j + 1) % sorted.length
    setAId(sorted[i].id)
    setBId(sorted[j].id)
  }

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto p-6">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-champi-gold">💘 Match Champi</h1>
        <p className="mt-1 text-sm text-champi-text-dim">
          Escolhe dois membros e descobre a “compatibilidade” do casal. Tudo na brincadeira —
          mas o resultado é sempre o mesmo para cada par. 👀
        </p>
      </div>

      {/* Seletores */}
      <div className="mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Picker label="Pessoa 1" value={aId} onChange={setAId} options={sorted} byId={byId} />
        <div className="hidden pb-2.5 text-center text-2xl sm:block">✕</div>
        <Picker label="Pessoa 2" value={bId} onChange={setBId} options={sorted} byId={byId} />
      </div>

      <div className="mb-6 flex justify-center">
        <button onClick={sorteia} className="btn-ghost">
          🎲 Sortear casal
        </button>
      </div>

      {/* Resultado */}
      {!result && (
        <p className="mt-10 text-center text-sm text-champi-text-dim">
          {aId && bId && aId === bId
            ? 'Escolhe duas pessoas diferentes 🙃'
            : 'Escolhe duas pessoas para ver a magia acontecer.'}
        </p>
      )}

      {result && (
        <div className="card animate-fade-in overflow-hidden">
          {/* casal */}
          <div className="flex items-center justify-center gap-4 bg-gradient-to-br from-champi-purple-deep/50 to-champi-ink-3 p-5">
            <Face member={result.a} />
            <div className="text-center">
              <div className="text-3xl">{result.tier.emoji}</div>
            </div>
            <Face member={result.b} />
          </div>

          {/* percentagem */}
          <div className="p-5">
            <div className="mb-1 flex items-end justify-between">
              <span className="font-display text-5xl font-bold" style={{ color: result.tier.color }}>
                {result.pct}%
              </span>
              <span className="text-sm font-medium" style={{ color: result.tier.color }}>
                {result.tier.label}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-champi-ink-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${result.pct}%`,
                  background: `linear-gradient(90deg, #7c4dff, ${result.tier.color})`,
                }}
              />
            </div>

            <p className="mt-4 border-l-2 border-champi-gold/70 pl-3 font-display text-lg italic text-champi-text">
              “{result.verdict}”
            </p>

            {result.factors.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {result.factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-champi-text-dim">
                    <span className="leading-none">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            )}

            <button onClick={copyLink} className="btn-ghost mt-5 w-full">
              {copied ? '✓ Link copiado!' : '🔗 Copiar link deste par'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Picker({ label, value, onChange, options, byId }) {
  const sel = value ? byId.get(value) : null
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-champi-text-dim">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Face member={sel} size={40} />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-champi-line bg-champi-ink-3/70 px-3 py-2 text-sm text-champi-text focus:border-champi-gold/60 focus:outline-none"
        >
          <option value="">— escolher —</option>
          {options.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function Face({ member, size = 56 }) {
  const photo = member?.photo_url
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-champi-gold/60 bg-champi-ink font-bold text-champi-gold"
      style={{ width: size, height: size, fontSize: size / 2.6 }}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (member?.name || '?').charAt(0)
      )}
    </div>
  )
}
