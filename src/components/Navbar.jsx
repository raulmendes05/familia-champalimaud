import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-champi-ink-3 text-champi-gold'
      : 'text-champi-text-dim hover:text-champi-text'
  }`

export default function Navbar() {
  return (
    <header className="z-30 flex items-center justify-between border-b border-champi-line/70 bg-champi-ink-2/80 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <img src="/champi.svg" alt="" className="h-8 w-8" />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold text-champi-gold">Família Champalimaud</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-champi-text-dim">
            Árvore de praxe
          </p>
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
        <NavLink to="/login" className={linkClass}>
          Entrar
        </NavLink>
      </nav>
    </header>
  )
}
