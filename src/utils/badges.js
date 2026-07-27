// Conquistas (badges) de cada membro — TUDO derivado dos dados reais
// (relações + roleta + geração). Sem estado: dá o mesmo resultado sempre.
import { eliminationMap, ROULETTE_EXCLUDED } from '../data/roleta'
import { isFounder } from '../data/founders'

const VERT = new Set(['padrinho', 'madrinha'])

// Graus de praxe.
const RANK_BADGE = {
  veterano: { key: 'veterano', emoji: '🎖️', label: 'Veterano', desc: 'Grau de Veterano.', color: '#a98bff' },
  doutor: { key: 'doutor', emoji: '🎓', label: 'Doutor', desc: 'Grau de Doutor.', color: '#a98bff' },
  pastrano: { key: 'pastrano', emoji: '📚', label: 'Pastrano', desc: 'Grau de Pastrano.', color: '#e8c969' },
  caloiro: { key: 'caloiro', emoji: '🐣', label: 'Caloiro', desc: 'Grau de Caloiro.', color: '#e8c969' },
}

// Regra geral: geração → grau.
const GEN_RANK = { 1: 'veterano', 3: 'doutor', 4: 'pastrano', 5: 'caloiro' }

// Gen 2 não é uniforme — grau definido por pessoa (indicado pelo Raul).
// Quem não aparece aqui (Carvalheira, André, Pedro) não tem grau.
const GEN2_RANK = {
  gomes: 'doutor', vasco: 'doutor',
  piri: 'veterano', bras: 'veterano', clara: 'veterano', rodolfo: 'veterano',
  cesar: 'veterano', henrique: 'veterano', maria_costa: 'veterano',
  andreia: 'veterano', leonor_mendes: 'veterano',
}

// Exceções: membros sem grau hierárquico, mesmo que a geração indicasse um.
const NO_RANK = new Set(['sissi'])

// Alcunhas lendárias escolhidas à mão (além das mais compridas).
const LEGENDARY_NICK = new Set(['gabriel', 'ximenes'])

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

  // Grau de praxe. Gen 2 é por pessoa; algumas exceções não têm grau.
  if (!NO_RANK.has(member.id)) {
    const rank = member.generation === 2 ? GEN2_RANK[member.id] : GEN_RANK[member.generation]
    if (rank && RANK_BADGE[rank]) out.push(RANK_BADGE[rank])
  }

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

  // 🗣️ Alcunha lendária — top ~5 alcunhas mais compridas + escolhidos à mão.
  const myNick = (member.nickname || '').trim()
  if (myNick) {
    const lengths = members
      .map((mm) => (mm.nickname || '').trim().length)
      .filter((n) => n > 0)
      .sort((a, b) => b - a)
    const threshold = lengths[Math.min(4, lengths.length - 1)] || Infinity
    if (myNick.length >= threshold || LEGENDARY_NICK.has(member.id)) {
      out.push({
        key: 'alcunha_lendaria',
        emoji: '🗣️',
        label: 'Alcunha lendária',
        desc: 'Uma das alcunhas mais épicas (e compridas) da família.',
        color: '#e8c969',
      })
    }
  }

  return out
}

/**
 * Emojis dos badges para mostrar de forma compacta (nós da árvore, cartões).
 * Exclui o de fundador (já é mostrado em separado) e limita a `max`.
 */
export function badgeEmojis(member, members, relationships, max = 3) {
  return badgesFor(member, members, relationships)
    .filter((b) => b.key !== 'fundador')
    .slice(0, max)
    .map((b) => b.emoji)
}
