// Utilitários puros (sem React/D3) para transformar membros + relações
// em estruturas úteis: hierarquia para a árvore, graus de separação e estatísticas.

const VERTICAL_TYPES = new Set(['padrinho', 'madrinha'])

/** Index rápido id → member */
export function indexMembers(members) {
  const map = new Map()
  for (const m of members) map.set(m.id, m)
  return map
}

/**
 * Para cada afilhado escolhe UM padrinho primário (a árvore é uma hierarquia,
 * não um grafo). Preferência: relação com is_primary === true; senão a primeira
 * relação vertical encontrada para esse filho. Devolve Map child → parent.
 */
function primaryParentMap(members, relationships) {
  const byId = indexMembers(members)
  const primary = new Map()
  // 1ª passagem: as marcadas como primárias
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    if (!byId.has(r.parent_id) || !byId.has(r.child_id)) continue
    if (r.is_primary && !primary.has(r.child_id)) primary.set(r.child_id, r.parent_id)
  }
  // 2ª passagem: preencher quem ficou sem primário com a primeira relação
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    if (!byId.has(r.parent_id) || !byId.has(r.child_id)) continue
    if (!primary.has(r.child_id)) primary.set(r.child_id, r.parent_id)
  }
  return primary
}

/**
 * Constrói uma hierarquia (forest → single root virtual) usando apenas o
 * padrinho PRIMÁRIO de cada membro. Devolve `{ id: '__root__', children: [...] }`
 * pronto para `d3.hierarchy`.
 */
export function buildHierarchy(members, relationships) {
  const byId = indexMembers(members)
  const primary = primaryParentMap(members, relationships)
  const childrenOf = new Map() // parentId → [childId]
  for (const [child, parent] of primary) {
    if (!childrenOf.has(parent)) childrenOf.set(parent, [])
    childrenOf.get(parent).push(child)
  }

  const build = (id) => {
    const member = byId.get(id)
    const kids = (childrenOf.get(id) || []).map(build)
    return { id, member, children: kids }
  }

  // raízes = membros sem padrinho primário (os fundadores)
  const roots = members.filter((m) => !primary.has(m.id)).map((m) => build(m.id))

  return { id: '__root__', member: null, children: roots }
}

/**
 * Ligações de co-padrinho/madrinha (todas as verticais que NÃO são a primária
 * do filho). Desenhadas como linhas extra na árvore. Devolve [{parent_id, child_id, type}].
 */
export function secondaryParentEdges(members, relationships) {
  const byId = indexMembers(members)
  const primary = primaryParentMap(members, relationships)
  const extra = []
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    if (!byId.has(r.parent_id) || !byId.has(r.child_id)) continue
    if (primary.get(r.child_id) === r.parent_id) continue // é a primária
    extra.push({ parent_id: r.parent_id, child_id: r.child_id, type: r.type })
  }
  return extra
}

/**
 * Grafo não-direccionado de TODAS as relações (verticais + irmãos),
 * para calcular graus de separação.
 */
export function buildAdjacency(members, relationships) {
  const adj = new Map()
  for (const m of members) adj.set(m.id, new Set())
  for (const r of relationships) {
    if (!adj.has(r.parent_id) || !adj.has(r.child_id)) continue
    adj.get(r.parent_id).add(r.child_id)
    adj.get(r.child_id).add(r.parent_id)
  }
  return adj
}

/**
 * Caminho mais curto (BFS) entre dois membros sobre o grafo de relações.
 * Devolve { degree, path: [ids] } ou null se não houver ligação.
 */
export function degreesOfSeparation(adj, fromId, toId) {
  if (fromId === toId) return { degree: 0, path: [fromId] }
  if (!adj.has(fromId) || !adj.has(toId)) return null

  const prev = new Map([[fromId, null]])
  const queue = [fromId]
  while (queue.length) {
    const cur = queue.shift()
    for (const next of adj.get(cur)) {
      if (prev.has(next)) continue
      prev.set(next, cur)
      if (next === toId) {
        const path = []
        let n = toId
        while (n !== null) {
          path.unshift(n)
          n = prev.get(n)
        }
        return { degree: path.length - 1, path }
      }
      queue.push(next)
    }
  }
  return null
}

/**
 * Conjunto de ids no "ramo" de um membro: os seus antepassados (linha de
 * padrinhos) + ele próprio + todos os descendentes (afilhados). Usado para
 * destacar a linhagem na árvore.
 */
export function branchOf(memberId, relationships) {
  const parentsOf = new Map() // child → [parents]  (inclui co-padrinhos)
  const childrenOf = new Map()
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    if (!parentsOf.has(r.child_id)) parentsOf.set(r.child_id, [])
    parentsOf.get(r.child_id).push(r.parent_id)
    if (!childrenOf.has(r.parent_id)) childrenOf.set(r.parent_id, [])
    childrenOf.get(r.parent_id).push(r.child_id)
  }

  const branch = new Set([memberId])
  // antepassados (todos os padrinhos, a subir)
  const up = [memberId]
  while (up.length) {
    const cur = up.pop()
    for (const p of parentsOf.get(cur) || []) {
      if (!branch.has(p)) {
        branch.add(p)
        up.push(p)
      }
    }
  }
  // descendentes (a descer a partir do membro)
  const down = [memberId]
  while (down.length) {
    const cur = down.pop()
    for (const c of childrenOf.get(cur) || []) {
      if (!branch.has(c)) {
        branch.add(c)
        down.push(c)
      }
    }
  }
  return branch
}

/**
 * Linhagem de um membro: sobe pelos padrinhos PRIMÁRIOS até ao fundador.
 * Devolve um array ordenado [fundador, …, membro].
 */
export function lineageOf(memberId, relationships) {
  const primaryOf = new Map()
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    if (r.is_primary && !primaryOf.has(r.child_id)) primaryOf.set(r.child_id, r.parent_id)
  }
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    if (!primaryOf.has(r.child_id)) primaryOf.set(r.child_id, r.parent_id)
  }
  const path = [memberId]
  const seen = new Set([memberId])
  let cur = memberId
  while (primaryOf.has(cur)) {
    const p = primaryOf.get(cur)
    if (seen.has(p)) break
    path.unshift(p)
    seen.add(p)
    cur = p
  }
  return path
}

/** Fundador de quem o membro descende (topo da linhagem primária). */
export function founderOf(memberId, relationships) {
  return lineageOf(memberId, relationships)[0]
}

/** Relações directas de um membro, agrupadas para o painel de perfil. */
export function relationsOf(memberId, members, relationships) {
  const byId = indexMembers(members)
  const padrinhos = []
  const afilhados = []
  const irmaos = []

  for (const r of relationships) {
    if (VERTICAL_TYPES.has(r.type)) {
      if (r.child_id === memberId && byId.has(r.parent_id)) {
        padrinhos.push({ member: byId.get(r.parent_id), type: r.type })
      }
      if (r.parent_id === memberId && byId.has(r.child_id)) {
        afilhados.push({ member: byId.get(r.child_id), type: r.type })
      }
    } else if (r.type === 'irmao') {
      if (r.parent_id === memberId && byId.has(r.child_id)) {
        irmaos.push({ member: byId.get(r.child_id), type: r.type })
      }
      if (r.child_id === memberId && byId.has(r.parent_id)) {
        irmaos.push({ member: byId.get(r.parent_id), type: r.type })
      }
    }
  }
  return { padrinhos, afilhados, irmaos }
}

/** Estatísticas globais da família. */
export function computeStats(members, relationships) {
  const total = members.length
  const generations = new Set(members.map((m) => m.generation)).size

  const padrinhoCount = relationships.filter((r) => VERTICAL_TYPES.has(r.type)).length

  // Membro com mais afilhados (padrinho/madrinha de mais gente).
  const afilhadosCount = new Map()
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    afilhadosCount.set(r.parent_id, (afilhadosCount.get(r.parent_id) || 0) + 1)
  }
  let topPadrinhoId = null
  let topPadrinhoCount = 0
  for (const [id, count] of afilhadosCount) {
    if (count > topPadrinhoCount) {
      topPadrinhoId = id
      topPadrinhoCount = count
    }
  }
  const topPadrinho = topPadrinhoId
    ? members.find((m) => m.id === topPadrinhoId)?.name || null
    : null

  return {
    total,
    generations,
    padrinhoLinks: padrinhoCount,
    topPadrinho,
    topPadrinhoCount,
  }
}
