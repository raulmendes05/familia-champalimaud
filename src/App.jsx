import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import TreePage from './pages/TreePage'
import MembersPage from './pages/MembersPage'
import GenerationsPage from './pages/GenerationsPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <CartoonDefs />
      <Navbar />
      <main className="relative flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<TreePage />} />
          <Route path="/membros" element={<MembersPage />} />
          <Route path="/geracoes" element={<GenerationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

/**
 * Filtro "cartoon" aplicado às fotos: suaviza, satura e posteriza as cores
 * (bandas chapadas tipo ilustração). Usado via filter:url(#cartoon).
 */
function CartoonDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id="cartoon" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="0.6" result="smooth" />
          <feColorMatrix in="smooth" type="saturate" values="1.55" result="sat" />
          <feComponentTransfer in="sat">
            <feFuncR type="discrete" tableValues="0 0.27 0.53 0.78 1" />
            <feFuncG type="discrete" tableValues="0 0.27 0.53 0.78 1" />
            <feFuncB type="discrete" tableValues="0 0.27 0.53 0.78 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  )
}
