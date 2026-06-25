import { useEffect, useState } from 'react'
import {
  members as mockMembers,
  relationships as mockRelationships,
} from '../data/mockData'
import {
  isSupabaseConfigured,
  fetchMembers,
  fetchRelationships,
} from '../lib/supabase'

/**
 * Fonte de dados da família.
 *  - Se o Supabase estiver configurado (.env.local) → vai buscar os dados reais.
 *  - Caso contrário → corre em modo demo com os dados mock.
 *
 * Forma estável: { members, relationships, loading, error, source }.
 */
export function useMembers() {
  const useRemote = isSupabaseConfigured()
  const [members, setMembers] = useState(useRemote ? [] : mockMembers)
  const [relationships, setRelationships] = useState(useRemote ? [] : mockRelationships)
  const [loading, setLoading] = useState(useRemote)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!useRemote) return
    let alive = true
    ;(async () => {
      try {
        const [m, r] = await Promise.all([fetchMembers(), fetchRelationships()])
        if (!alive) return
        setMembers(m)
        setRelationships(r)
      } catch (err) {
        if (!alive) return
        // Falhou o remoto → cai para os dados mock para a app não ficar vazia.
        setError(err)
        setMembers(mockMembers)
        setRelationships(mockRelationships)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [useRemote])

  return {
    members,
    relationships,
    loading,
    error,
    source: useRemote ? 'supabase' : 'mock',
  }
}
