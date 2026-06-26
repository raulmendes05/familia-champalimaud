import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import TreePage from './pages/TreePage'
import MembersPage from './pages/MembersPage'
import GenerationsPage from './pages/GenerationsPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <div className="flex h-screen flex-col">
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
