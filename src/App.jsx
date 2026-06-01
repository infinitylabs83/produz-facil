import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import KitchenProduction from './pages/KitchenProduction'
import AdminDashboard from './pages/AdminDashboard'
import AdminCadastros from './pages/AdminCadastros'
import Historico from './pages/Historico'
import Configuracoes from './pages/Configuracoes'

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

      <Route path="/" element={
        !user ? <Navigate to="/login" replace />
          : perfil === 'operador' ? <Navigate to="/producao" replace />
          : <Navigate to="/dashboard" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
