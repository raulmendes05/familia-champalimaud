import { useState } from 'react'
import { isSupabaseConfigured, signInWithMagicLink } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [message, setMessage] = useState('')

  const configured = isSupabaseConfigured()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!configured) {
      setStatus('error')
      setMessage('Supabase ainda não está configurado (.env.local). O login fica disponível depois.')
      return
    }
    setStatus('sending')
    try {
      await signInWithMagicLink(email)
      setStatus('sent')
      setMessage('Magic link enviado! Verifica o teu email.')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Não foi possível enviar o magic link.')
    }
  }

  return (
    <div className="grid h-full place-items-center p-6">
      <div className="card w-full max-w-sm p-7 text-center shadow-glow">
        <img src="/champi.svg" alt="" className="mx-auto h-14 w-14" />
        <h1 className="mt-3 font-display text-2xl font-semibold text-champi-gold">Entrar</h1>
        <p className="mt-1 text-sm text-champi-text-dim">
          Recebe um magic link no teu email para editares o teu perfil.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="o-teu-email@exemplo.pt"
            className="w-full rounded-lg border border-champi-line bg-champi-ink/70 px-3 py-2.5 text-sm
              text-champi-text placeholder:text-champi-text-dim focus:border-champi-gold/60 focus:outline-none"
          />
          <button type="submit" disabled={status === 'sending'} className="btn-gold w-full disabled:opacity-60">
            {status === 'sending' ? 'A enviar…' : 'Enviar magic link'}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${
              status === 'error' ? 'text-red-300' : 'text-champi-gold-soft'
            }`}
          >
            {message}
          </p>
        )}

        {!configured && (
          <p className="mt-4 rounded-lg bg-champi-ink-3/60 p-2.5 text-xs text-champi-text-dim">
            Modo demo — a correr com dados mock. Liga o Supabase para activar a autenticação.
          </p>
        )}
      </div>
    </div>
  )
}
