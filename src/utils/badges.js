// Conquistas (badges) de cada membro — TUDO derivado dos dados reais
// (relações + roleta + geração). Sem estado: dá o mesmo resultado sempre.
import { eliminationMap, ROULETTE_EXCLUDED } from '../data/roleta'
import { isFounder } from '../data/founders'

const VERT = new Set(['padrinho', 'madrinha'])

// Badge por geração (nomenclatura de praxe). Gen 2 fica de fora de propósito:
// tem veteranos e doutores misturados.
const GEN_BADGE = {
  1: { key: 'veterano', emoji: '🎖️', label: 'Veterano', desc: 'Geração 1 — a mais antiga.', color: '#a98bff' },
  3: { key: 'doutor', emoji: '🎓', label: 'Doutor', desc: 'Geração 3.', color: '#a98bff' },
  4: { key: 'pastrano', emoji: '📚', label: 'Pastrano', desc: 'Geração 4.', color: '#e8c969' },
  5: { key: 'caloiro', emoji: '🐣', label: 'Caloiro', desc: 'Geração 5 — a mais nova.', color: '#e8c969' },
}

function childrenMap(relationships) {
  const m = new Map()
  for (const r of relationships) {
    if (!VERT.has(r.type)) continue
    if (!m.has(r.parent_id)) m.set(r.parent_id, [])
    m.get(r.parent_id).push(r.child_id)
  }
  return m
}

/** Nº total de descendentes (afilhados, netos, …) de um membro. */
function descendantsCount(id, childrenOf) {
  let n = 0
  const seen = new Set()
  const stack = [...(childrenOf.get(id) || [])]
  while (stack.length) {
    const c = stack.pop()
    if (seen.has(c)) continue
    seen.add(c)
    n++
    for (const k of childrenOf.get(c) || []) stack.push(k)
  }
  return n
}

/**
 * Devolve a lista de conquistas de um membro.
 * Cada badge: { key, emoji, label, desc, color }
 */
export function badgesFor(member, members, relationships) {
  if (!member) return []
  const out = []
  const childrenOf = childrenMap(relationships)
  const elimMap = eliminationMap()
  const excluded = new Set(ROULETTE_EXCLUDED)

  // afilhados diretos + se é madrinha (para Patriarca/Matriarca)
  const direct = childrenOf.get(member.id) || []
  const isMadrinha = relationships.some(
    (r) => r.parent_id === member.id && r.type === 'madrinha'
  )
  const godparents = relationships.filter(
    (r) => VERT.has(r.type) && r.child_id === member.id
  ).length
  const descs = descendantsCount(member.id, childrenOf)

  // 🏛️ Fundador
  if (isFounder(member.id)) {
    out.push({
      key: 'fundador',
      emoji: '🏛️',
      label: 'Fundador',
      desc: 'Um dos 4 fundadores da Champi.',
      color: '#d4af37',
    })
  }

  // 👑 Patriarca / Matriarca — 4+ afilhados diretos
  if (direct.length >= 4) {
    out.push({
      key: 'patriarca',
      emoji: '👑',
      label: isMadrinha ? 'Matriarca' : 'Patriarca',
      desc: `Tem ${direct.length} afilhados diretos.`,
      color: '#e8c969',
    })
  }

  // 🌳 Dinastia — 8+ descendentes na linhagem
  if (descs >= 8) {
    out.push({
      key: 'dinastia',
      emoji: '🌳',
      label: 'Dinastia',
      desc: `${descs} descendentes na sua linhagem.`,
      color: '#5fae7a',
    })
  }

  // Roleta
  if (!excluded.has(member.id)) {
    if (elimMap.has(member.id)) {
      out.push({
        key: 'caido',
        emoji: '⚰️',
        label: `Caído (Dia ${elimMap.get(member.id)})`,
        desc: 'Já foi "expulso" na Roleta Champi.',
        color: '#d9657a',
      })
    } else {
      out.push({
        key: 'sobrevivente',
        emoji: '🛡️',
        label: 'Sobrevivente',
        desc: 'Ainda na família — nunca caiu na Roleta.',
        color: '#5fae7a',
      })
    }
  }

  // Badge por geração (nomenclatura de praxe).
  // Gen 2 fica de fora: tem veteranos e doutores misturados.
  const gen = GEN_BADGE[member.generation]
  if (gen) out.push(gen)

  // 👯 Afilhado de dois — co-padrinhos
  if (godparents >= 2) {
    out.push({
      key: 'dois_padrinhos',
      emoji: '👯',
      label: 'Afilhado de dois',
      desc: 'Tem dois padrinhos/madrinhas.',
      color: '#a98bff',
    })
  }

  return out
}
