import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/supabase'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-champi-ink-3 text-champi-gold'
      : 'text-champi-text-dim hover:text-champi-text'
  }`

export default function Navbar() {
  const { email, isAdmin } = useAuth()

  return (
    <header className="z-30 flex items-center justify-between border-b border-champi-line/70 bg-champi-ink-2/80 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <img src="/brasao.png" alt="Brasão Champi" className="h-9 w-9 rounded-lg object-cover ring-1 ring-champi-line" />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold text-champi-gold">Família Champalimaud</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-champi-text-dim">Árvore Champi</p>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        <NavLink to="/" className={linkClass} end>
          Árvore
        </NavLink>
        <NavLink to="/membros" className={linkClass}>
          Membros
        </NavLink>
        <NavLink to="/geracoes" className={linkClass}>
          Gerações
        </NavLink>
        <NavLink to="/roleta" className={linkClass}>
          Roleta
        </NavLink>
        <NavLink to="/match" className={linkClass}>
          Match
        </NavLink>
        <NavLink to="/quiz" className={linkClass}>
          Quiz
        </NavLink>
        <NavLink to="/pinball" className={linkClass}>
          Pinball
        </NavLink>
        <NavLink to="/eventos" className={linkClass}>
          Eventos
        </NavLink>
        {isAdmin ? (
          <div className="ml-1 flex items-center gap-1.5">
            <span className="rounded-full bg-champi-gold/15 px-2 py-1 text-xs font-medium text-champi-gold">
              Admin
            </span>
            <button
              onClick={() => signOut()}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-champi-text-dim hover:text-champi-text"
            >
              Sair
            </button>
          </div>
        ) : email ? (
          <button
            onClick={() => signOut()}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-champi-text-dim hover:text-champi-text"
          >
            Sair
          </button>
        ) : (
          <NavLink to="/login" className={linkClass}>
            Entrar
          </NavLink>
        )}
      </nav>
    </header>
  )
}
