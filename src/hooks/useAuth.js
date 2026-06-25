import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Email do administrador — só este utilizador pode editar fotos.
export const ADMIN_EMAIL = 'raulmendes2005@gmail.com'

/** Estado de sessão do Supabase. { email, ready, isAdmin } */
export function useAuth() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const email = session?.user?.email || null
  return { email, ready, isAdmin: email != null && email === ADMIN_EMAIL }
}
