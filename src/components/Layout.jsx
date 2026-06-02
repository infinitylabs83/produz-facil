import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const { perfil, user, logout } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)
  const [logoUrl, setLogoUrl]   = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [leadsNovos, setLeadsNovos] = useState(0)

  // Inicializa o tema salvo
  useEffect(() => {
    const temasSalvo = localStorage.getItem('tema') === 'dark'
    setDarkMode(temasSalvo)
    document.documentElement.setAttribute('data-theme', temasSalvo ? 'dark' : 'light')
  }, [])

  // Carrega logo e nome da empresa
  useEffect(() => {
    async function carregarEmpresa() {
      if (!user) return
      const { data: usuario } = await supabase
        .from('usuarios').select('empresa_id').eq('id', user.id).single()
      if (!usuario?.empresa_id) return
      const { data: empresa } = await supabase
        .from('empresas').select('nome, logo_url').eq('id', usuario.empresa_id).single()
      if (empresa) {
        setNomeEmpresa(empresa.nome || '')
        setLogoUrl(empresa.logo_url || null)
      }
    }
    carregarEmpresa()
  }, [user])

  // Conta leads sem acesso criado (só para gestor)
  useEffect(() => {
    if (perfil !== 'gestor') return
    supabase.from('leads').select('id', { count: 'exact' }).eq('convertido', false)
      .then(({ count }) => setLeadsNovos(count || 0))
  }, [perfil])

  function toggleDarkMode() {
    const novoTema = !darkMode
    setDarkMode(novoTema)
    document.documentElement.setAttribute('data-theme', novoTema ? 'dark' : 'light')
    localStorage.setItem('tema', novoTema ? 'dark' : 'light')
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const ehAdmin = perfil === 'administrativo' || perfil === 'gestor'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          {logoUrl ? (
            <div style={{ marginBottom: '8px' }}>
              <img
                src={logoUrl} alt={nomeEmpresa || 'Logo'}
                style={{ maxHeight: '52px', maxWidth: '160px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          ) : null}
          <div style={{ color: 'var(--cor-primaria)', fontWeight: 700, fontSize: logoUrl ? '0.9rem' : '1.2rem' }}>
            {nomeEmpresa || 'ProduzFácil'}
          </div>
          <span>CMV — Controle de Custos</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/producao" className={({ isActive }) => isActive ? 'ativo' : ''}>
            🍳 Nova Produção
          </NavLink>

          {ehAdmin && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'ativo' : ''}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/historico" className={({ isActive }) => isActive ? 'ativo' : ''}>
                📅 Histórico
              </NavLink>
              <NavLink to="/cadastros" className={({ isActive }) => isActive ? 'ativo' : ''}>
                📋 Cadastros
              </NavLink>
              <NavLink to="/configuracoes" className={({ isActive }) => isActive ? 'ativo' : ''}>
                ⚙️ Configurações
              </NavLink>
              {perfil === 'gestor' && (
                <NavLink to="/leads" className={({ isActive }) => isActive ? 'ativo' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎯 Leads Beta</span>
                  {leadsNovos > 0 && (
                    <span style={{ background: '#f97316', color: 'white', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', minWidth: '20px', textAlign: 'center' }}>
                      {leadsNovos}
                    </span>
                  )}
                </NavLink>
              )}
            </>
          )}

          {/* Botão dark mode */}
          <button onClick={toggleDarkMode} className="btn-dark-mode" style={{ marginTop: '12px' }}>
            {darkMode ? '☀️ Modo claro' : '🌙 Modo escuro'}
          </button>

          <button onClick={handleLogout} style={{ marginTop: 'auto' }}>
            🚪 Sair
          </button>
        </nav>

        <div className="sidebar-footer">
          {user?.email}
          <br />
          <strong style={{ textTransform: 'capitalize' }}>{perfil}</strong>
        </div>
      </aside>

      <main className="conteudo-principal">
        {children}
      </main>
    </div>
  )
}
