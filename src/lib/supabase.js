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

// ── Eventos ──────────────────────────────────────────────────────────────────
// Leitura: a RLS já só devolve eventos aprovados (e os pendentes ao admin).
export async function fetchEvents() {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createEvent(event) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase
    .from('events')
    .insert({ ...event, status: 'pending' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function approveEvent(id) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.from('events').update({ status: 'approved' }).eq('id', id)
  if (error) throw error
}

export async function deleteEvent(id) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

export async function fetchEventComments(eventId) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase
    .from('event_comments')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addEventComment(eventId, authorName, text) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase
    .from('event_comments')
    .insert({ event_id: eventId, author_name: authorName, text })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchEventPhotos(eventId) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase
    .from('event_photos')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Carrega o ficheiro para o Storage e devolve o URL público. */
export async function uploadEventPhoto(eventId, file) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${eventId}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await supabase.storage.from('event-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('event-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function addEventPhoto(eventId, authorName, url, caption) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase
    .from('event_photos')
    .insert({ event_id: eventId, author_name: authorName, url, caption })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Votação do vencedor da Roleta (1 voto por membro, trancado) ──────────────
/** Devolve { tally: {choiceId: nº votos}, votedBy: {voterId: choiceId} }. */
export async function fetchWinnerVotes() {
  if (!supabase) return { tally: {}, votedBy: {} }
  const { data, error } = await supabase.from('winner_votes').select('voter_id, choice_id')
  if (error) throw error
  const tally = {}
  const votedBy = {}
  for (const r of data) {
    tally[r.choice_id] = (tally[r.choice_id] || 0) + 1
    votedBy[r.voter_id] = r.choice_id
  }
  return { tally, votedBy }
}

/** Regista o voto de um membro. Falha se esse membro já votou (voto trancado). */
export async function castWinnerVote(voterId, choiceId) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.from('winner_votes').insert({ voter_id: voterId, choice_id: choiceId })
  if (error) {
    if (error.code === '23505') throw new Error('Esse nome já votou — o voto fica trancado.')
    throw error
  }
}
