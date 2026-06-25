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
 * Constrói uma hierarquia (forest → single root virtual) a partir das
 * relações padrinho/madrinha. Devolve `{ id: '__root__', children: [...] }`
 * pronto para `d3.hierarchy`.
 */
export function buildHierarchy(members, relationships) {
  const byId = indexMembers(members)
  const childrenOf = new Map() // parentId → [childId]
  const hasParent = new Set()

  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    if (!byId.has(r.parent_id) || !byId.has(r.child_id)) continue
    if (!childrenOf.has(r.parent_id)) childrenOf.set(r.parent_id, [])
    childrenOf.get(r.parent_id).push(r.child_id)
    hasParent.add(r.child_id)
  }

  const build = (id) => {
    const member = byId.get(id)
    const kids = (childrenOf.get(id) || []).map(build)
    return { id, member, children: kids }
  }

  // raízes = membros sem padrinho
  const roots = members.filter((m) => !hasParent.has(m.id)).map((m) => build(m.id))

  return { id: '__root__', member: null, children: roots }
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
  const parentOf = new Map() // child → parent
  const childrenOf = new Map()
  for (const r of relationships) {
    if (!VERTICAL_TYPES.has(r.type)) continue
    parentOf.set(r.child_id, r.parent_id)
    if (!childrenOf.has(r.parent_id)) childrenOf.set(r.parent_id, [])
    childrenOf.get(r.parent_id).push(r.child_id)
  }

  const branch = new Set([memberId])
  // antepassados
  let p = parentOf.get(memberId)
  while (p) {
    branch.add(p)
    p = parentOf.get(p)
  }
  // descendentes (DFS)
  const stack = [memberId]
  while (stack.length) {
    const cur = stack.pop()
    for (const c of childrenOf.get(cur) || []) {
      if (!branch.has(c)) {
        branch.add(c)
        stack.push(c)
      }
    }
  }
  return branch
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

  const courseCount = new Map()
  for (const m of members) {
    if (!m.course) continue // curso por preencher — não conta
    courseCount.set(m.course, (courseCount.get(m.course) || 0) + 1)
  }
  let topCourse = null
  let topCount = 0
  for (const [course, count] of courseCount) {
    if (count > topCount) {
      topCourse = course
      topCount = count
    }
  }

  const padrinhoCount = relationships.filter((r) => VERTICAL_TYPES.has(r.type)).length

  return {
    total,
    generations,
    topCourse,
    topCourseCount: topCount,
    padrinhoLinks: padrinhoCount,
  }
}
