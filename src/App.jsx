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
import PainelMaster from './pages/PainelMaster'
import KitchenGateway from './pages/KitchenGateway'

// Tela exibida quando o usuário confirmou o e-mail mas o admin ainda não criou o perfil
function AguardandoAprovacao() {
  const { logout } = useAuth()
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#1e293b', borderRadius: '20px', padding: '40px 32px', textAlign: 'center', border: '1px solid #334155' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#f1f5f9', marginBottom: '12px' }}>
          Inscrição confirmada!
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>
          Seu e-mail foi verificado com sucesso. Nossa equipe está preparando seu acesso ao <strong style={{ color: '#f97316' }}>ProduzFácil CMV</strong>.
        </p>
        <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '28px', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#f97316', marginBottom: '10px', fontSize: '0.9rem' }}>📋 Próximos passos:</div>
          {[
            '✅ E-mail confirmado',
            '⏳ Aguardando liberação do acesso',
            '📱 Você será avisado pelo WhatsApp',
            '🚀 Acesso liberado em até 24h',
          ].map((s, i) => (
            <div key={i} style={{ fontSize: '0.85rem', color: i === 0 ? '#22c55e' : '#64748b', marginBottom: '6px' }}>{s}</div>
          ))}
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid #334155', color: '#64748b', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
          Sair
        </button>
      </div>
    </div>
  )
}

function RotaProtegida({ children, perfisPermitidos }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div className="loading-tela">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  // Usuário autenticado mas sem perfil ainda → aguardando aprovação do admin
  if (!perfil) return <AguardandoAprovacao />
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
        element={
          !user ? <Login /> :
          !perfil ? <AguardandoAprovacao /> :
          <Navigate to={perfil === 'operador' ? '/producao' : '/dashboard'} replace />
        }
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

      {/* Painel Master — completamente isolado, sem Layout do app */}
      <Route path="/painel-master" element={<PainelMaster />} />

      {/* Cozinha — acesso via QR Code + PIN, sem login Supabase */}
      <Route path="/cozinha" element={<KitchenGateway />} />

      <Route path="/" element={
        !user ? <Landing /> :
        !perfil ? <AguardandoAprovacao /> :
        perfil === 'operador' ? <Navigate to="/producao" replace /> :
        <Navigate to="/dashboard" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
