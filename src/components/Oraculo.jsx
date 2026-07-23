import { useMemo } from 'react'
import { relationsOf, allFoundersOf } from '../utils/tree'
import { eliminationMap } from '../data/roleta'
import { LINEAGE_LABELS } from '../data/founders'

// Hash determinístico (FNV-1a) → o Oráculo dá sempre o mesmo até haver nova eliminação.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const GENERIC = [
  'Anda demasiado confiante — e isso, aqui, cheira sempre a sentença.',
  'A roda sonhou com este nome a noite passada. 😴',
  'As estrelas alinharam-se em forma de caixão. ⚰️',
  'Tem cara de quem já pagou a última rodada. 🍺',
  'O algoritmo detetou "vibe de despedida". 📉',
  'Sobrou-lhe sorte a mais nos últimos dias. A conta chega hoje. 🧾',
]

/**
 * Oráculo — preditor CÓMICO (a fingir). Cada sobrevivente recebe um "risco"
 * determinístico por dia + uma justificação a partir dos dados reais.
 */
export default function Oraculo({ survivors, members, relationships, dia }) {
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const elim = useMemo(() => eliminationMap(), [])

  const board = useMemo(() => {
    // contagens entre sobreviventes (p/ razões de "último da geração/linhagem")
    const genCount = {}
    const linCount = {}
    for (const m of survivors) {
      genCount[m.generation] = (genCount[m.generation] || 0) + 1
      for (const f of allFoundersOf(m.id, relationships)) linCount[f] = (linCount[f] || 0) + 1
    }

    return survivors
      .map((m) => {
        const h = hash(m.id + '#' + dia)
        const risk = 45 + (h % 55) // 45..99 — todos parecem em perigo 😅
        const { padrinhos, afilhados } = relationsOf(m.id, members, relationships)

        const reasons = [...GENERIC]
        const deadAfilhados = afilhados.filter((a) => elim.has(a.member.id))
        if (deadAfilhados.length)
          reasons.push(
            `Já enterrou ${deadAfilhados.map((a) => a.member.name).join(', ')} — o karma tem boa memória. 😈`
          )
        if (genCount[m.generation] === 1)
          reasons.push(`Último sobrevivente da Geração ${m.generation} — solitários caem primeiro. 🐺`)
        const founders = allFoundersOf(m.id, relationships)
        for (const f of founders) {
          if (linCount[f] <= 2)
            reasons.push(
              `A linhagem ${LINEAGE_LABELS[f] || byId.get(f)?.name} está a definhar — a roda gosta de rematar. 🪦`
            )
        }
        const deadPadrinho = padrinhos.find((p) => elim.has(p.member.id))
        if (deadPadrinho)
          reasons.push(`O padrinho (${deadPadrinho.member.name}) já caiu — a família chama por si. 👻`)

        const reason = reasons[h % reasons.length]
        return { m, risk, reason }
      })
      .sort((a, b) => b.risk - a.risk || a.m.name.localeCompare(b.m.name))
  }, [survivors, members, relationships, elim, byId, dia])

  const top = board[0]
  const chance = survivors.length ? Math.round(100 / survivors.length) : 0

  const riskColor = (r) => (r >= 85 ? '#ef4444' : r >= 70 ? '#fb923c' : '#e8c969')

  return (
    <div>
      {/* Profecia do dia */}
      {top && (
        <div className="card mb-6 overflow-hidden">
          <div className="bg-gradient-to-br from-champi-purple-deep/60 to-champi-ink-3 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-champi-text-dim">
              🔮 O Oráculo prevê que o próximo a cair será…
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <OracleAvatar member={top.m} />
              <div className="text-left">
                <p className="font-display text-3xl font-bold text-champi-gold">{top.m.name}</p>
                <p className="text-sm font-semibold text-red-400">risco {top.risk}%</p>
              </div>
            </div>
            <p className="mx-auto mt-3 max-w-md text-sm italic text-champi-text">“{top.reason}”</p>
          </div>
        </div>
      )}

      {/* Quadro de risco */}
      <h2 className="mb-3 border-b border-champi-line pb-2 font-display text-xl font-semibold text-champi-text">
        📊 Quadro de risco · {survivors.length} em jogo
      </h2>
      <ol className="space-y-2.5">
        {board.map(({ m, risk, reason }, i) => (
          <li key={m.id} className="card p-3">
            <div className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-sm font-bold text-champi-text-dim">
                {i + 1}
              </span>
              <OracleAvatar member={m} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-display font-semibold text-champi-text">{m.name}</p>
                  <span className="shrink-0 text-sm font-bold" style={{ color: riskColor(risk) }}>
                    {risk}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-champi-ink-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${risk}%`, background: riskColor(risk) }}
                  />
                </div>
                <p className="mt-1 text-xs text-champi-text-dim">{reason}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-center text-[11px] text-champi-text-dim">
        Previsão 100% científica.* <br />
        <span className="opacity-70">
          *nem por isso — isto é uma roleta justa, cada um tem 1 em {survivors.length} (~{chance}%) de
          sair. O Oráculo é só teatro. 🎭
        </span>
      </p>
    </div>
  )
}

function OracleAvatar({ member, size = 48 }) {
  const photo = member?.photo_url
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-champi-gold/60 bg-champi-ink font-bold text-champi-gold"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (member?.name || '?').charAt(0)
      )}
    </div>
  )
}
