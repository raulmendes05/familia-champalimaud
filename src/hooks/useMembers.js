import { useState } from 'react'
import {
  members as mockMembers,
  relationships as mockRelationships,
} from '../data/mockData'

/**
 * Fonte de dados da família. Por agora devolve os dados mock.
 * Quando o Supabase estiver ligado, esta é a ÚNICA peça a mudar:
 * trocar o estado inicial por um fetch a `lib/supabase.js`.
 *
 * Mantém a mesma forma { members, relationships, loading, error }
 * para que as páginas não precisem de saber a origem.
 */
export function useMembers() {
  const [members] = useState(mockMembers)
  const [relationships] = useState(mockRelationships)

  return {
    members,
    relationships,
    loading: false,
    error: null,
  }
}
