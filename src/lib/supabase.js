import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true se as variáveis de ambiente do Supabase estiverem definidas. */
export function isSupabaseConfigured() {
  return Boolean(url && anonKey)
}

// Só cria o cliente se houver credenciais — assim a app corre em modo demo
// (dados mock) sem rebentar quando o Supabase ainda não está ligado.
export const supabase = isSupabaseConfigured() ? createClient(url, anonKey) : null

/** Envia um magic link de autenticação para o email. */
export async function signInWithMagicLink(email) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

// ── Acesso a dados (para quando trocares o useMembers para dados reais) ──────

export async function fetchMembers() {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('members').select('*')
  if (error) throw error
  return data
}

export async function fetchRelationships() {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('relationships').select('*')
  if (error) throw error
  return data
}

export async function updateMember(id, patch) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('members').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}
