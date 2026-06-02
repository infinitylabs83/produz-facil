import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Landing from './pages/Landing'
import KitchenProduction from './pages/KitchenProduction'
import AdminDashboard from './pages/AdminDashboard'
import AdminCadastros from './pages/AdminCadastros'
import Historico from './pages/Historico'
import Configuracoes from './pages/Configuracoes'
import Leads from './pages/Leads'

function RotaProtegida({ children, perfisPermitidos }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div className="loading-tela">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (perfisPermitidos && !perfisPermitidos.includes(perfil)) {
    return <Navigate to="/producao" replace />
  }
  return children
}

export default function App() {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div className="loading-tela">Carregando...</div>

  return (
    <Routes>
      {/* Landing page — pública */}
      <Route path="/landing" element={<Landing />} />

      <Route
        path="/login"
        element={user ? <Navigate to={perfil === 'operador' ? '/producao' : '/dashboard'} replace /> : <Login />}
      />

      <Route path="/producao" element={
        <RotaProtegida perfisPermitidos={['operador', 'administrativo', 'gestor']}>
          <Layout><KitchenProduction /></Layout>
        </RotaProtegida>
      } />

      <Route path="/dashboard" element={
        <RotaProtegida perfisPermitidos={['administrativo', 'gestor']}>
          <Layout><AdminDashboard /></Layout>
        </RotaProtegida>
      } />

      <Route path="/historico" element={
        <RotaProtegida perfisPermitidos={['administrativo', 'gestor']}>
          <Layout><Historico /></Layout>
        </RotaProtegida>
      } />

      <Route path="/cadastros" element={
        <RotaProtegida perfisPermitidos={['administrativo', 'gestor']}>
          <Layout><AdminCadastros /></Layout>
        </RotaProtegida>
      } />

      <Route path="/configuracoes" element={
        <RotaProtegida perfisPermitidos={['administrativo', 'gestor']}>
          <Layout><Configuracoes /></Layout>
        </RotaProtegida>
      } />

      <Route path="/leads" element={
        <RotaProtegida perfisPermitidos={['gestor']}>
          <Layout><Leads /></Layout>
        </RotaProtegida>
      } />

      <Route path="/" element={
        !user ? <Landing />
          : perfil === 'operador' ? <Navigate to="/producao" replace />
          : <Navigate to="/dashboard" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
