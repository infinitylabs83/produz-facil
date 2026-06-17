import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Detecta mobile
function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

export default function Layout({ children }) {
  const { perfil, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMobile()
  const [darkMode, setDarkMode] = useState(false)
  const [logoUrl, setLogoUrl]   = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [leadsNovos, setLeadsNovos] = useState(0)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    const temasSalvo = localStorage.getItem('tema') === 'dark'
    setDarkMode(temasSalvo)
    document.documentElement.setAttribute('data-theme', temasSalvo ? 'dark' : 'light')
  }, [])

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

  useEffect(() => {
    if (perfil !== 'gestor') return
    supabase.from('leads').select('id', { count: 'exact' }).eq('convertido', false)
      .then(({ count }) => setLeadsNovos(count || 0))
  }, [perfil])

  // Fecha menu ao trocar de rota
  useEffect(() => { setMenuAberto(false) }, [location.pathname])

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

  // Itens de navegação principal (para bottom bar mobile)
  const navItens = [
    { to: '/producao', emoji: '🍳', label: 'Produção', sempre: true },
    { to: '/dashboard', emoji: '📊', label: 'Dashboard', admin: true },
    { to: '/historico', emoji: '📅', label: 'Histórico', admin: true },
    { to: '/cadastros', emoji: '📋', label: 'Cadastros', admin: true },
  ]

  const navFiltrado = navItens.filter(i => i.sempre || (i.admin && ehAdmin))

  // ── DESKTOP: sidebar clássica ──
  if (!isMobile) return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          {logoUrl && (
            <div style={{ marginBottom: '8px' }}>
              <img src={logoUrl} alt={nomeEmpresa || 'Logo'}
                style={{ maxHeight: '52px', maxWidth: '160px', objectFit: 'contain', display: 'block' }} />
            </div>
          )}
          <div style={{ color: 'var(--cor-primaria)', fontWeight: 700, fontSize: logoUrl ? '0.9rem' : '1.2rem' }}>
            {nomeEmpresa || 'ProduzFácil'}
          </div>
          <span>CMV — Controle de Custos</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { to: '/producao', icon: '🍳', label: 'Nova Produção', sempre: true },
            { to: '/dashboard', icon: '📊', label: 'Dashboard', admin: true },
            { to: '/historico', icon: '📅', label: 'Histórico', admin: true },
            { to: '/cadastros', icon: '📋', label: 'Cadastros', admin: true },
            { to: '/configuracoes', icon: '⚙️', label: 'Configurações', admin: true },
          ].filter(i => i.sempre || (i.admin && ehAdmin)).map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'ativo' : ''}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button onClick={toggleDarkMode} className="btn-dark-mode" style={{ marginTop: '12px' }}>
            {darkMode ? '☀️ Modo claro' : '🌙 Modo escuro'}
          </button>
          <button onClick={handleLogout} style={{ marginTop: 'auto' }}>🚪 Sair</button>

          {/* Leads e Painel Master acessíveis só por URL direta — não aparecem no menu */}
        </nav>

        <div className="sidebar-footer">
          {user?.email}<br />
          <strong style={{ textTransform: 'capitalize' }}>{perfil}</strong>
        </div>
      </aside>

      <main className="conteudo-principal">{children}</main>
    </div>
  )

  // ── MOBILE: top bar + bottom tabs + drawer menu ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--cor-fundo)' }}>

      {/* TOP BAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'var(--cor-secundaria)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: '56px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ height: '32px', objectFit: 'contain' }} />
            : <span style={{ color: '#f97316', fontWeight: 800, fontSize: '1.1rem' }}>ProduzFácil</span>
          }
          {!logoUrl && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 500 }}>CMV</span>}
          {nomeEmpresa && logoUrl && (
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{nomeEmpresa}</span>
          )}
        </div>

        {/* Ações direita */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={toggleDarkMode} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px',
            padding: '8px', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          {/* Botão Sair — sempre visível */}
          <button onClick={handleLogout} style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
            color: '#fca5a5', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1,
          }}>
            🚪 Sair
          </button>
          {/* Botão hamburger para itens extras */}
          <button onClick={() => setMenuAberto(!menuAberto)} style={{
            background: menuAberto ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.08)',
            border: menuAberto ? '1px solid #f97316' : 'none',
            borderRadius: '8px', padding: '8px 10px', cursor: 'pointer',
            color: menuAberto ? '#f97316' : 'white', fontSize: '1.1rem', lineHeight: 1,
          }}>
            {menuAberto ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* DRAWER — menu lateral (itens extras) */}
      {menuAberto && (
        <>
          {/* Overlay */}
          <div onClick={() => setMenuAberto(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300,
          }} />
          {/* Painel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, width: '240px', height: '100vh',
            background: '#1e293b', zIndex: 400, display: 'flex', flexDirection: 'column',
            padding: '20px 0', boxShadow: '-4px 0 20px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
              <div style={{ color: '#f97316', fontWeight: 800, fontSize: '1rem' }}>
                {nomeEmpresa || 'ProduzFácil CMV'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '4px' }}>
                {user?.email}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                Perfil: {perfil}
              </div>
            </div>

            {/* Links do drawer */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {ehAdmin && (
                <NavLink to="/configuracoes"
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                    color: isActive ? '#f97316' : 'rgba(255,255,255,0.7)',
                    background: isActive ? 'rgba(249,115,22,0.1)' : 'transparent',
                    textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500,
                  })}>
                  ⚙️ Configurações
                </NavLink>
              )}
              {/* Leads e Painel Master acessíveis só por URL direta — não aparecem no menu */}
            </div>

            {/* Botão sair — sempre visível na base */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px' }}>
              <button onClick={handleLogout} style={{
                width: '100%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#fca5a5', borderRadius: '10px', padding: '14px', cursor: 'pointer',
                fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
              }}>
                🚪 Sair da conta
              </button>
            </div>
          </div>
        </>
      )}

      {/* CONTEÚDO */}
      <main style={{ flex: 1, padding: '16px', paddingBottom: '80px', overflowY: 'auto' }}>
        {children}
      </main>

      {/* BOTTOM TAB BAR */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--cor-secundaria)',
        display: 'flex', alignItems: 'stretch',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.3)',
        height: '64px',
      }}>
        {navFiltrado.map(item => {
          const ativo = location.pathname === item.to
          return (
            <NavLink key={item.to} to={item.to} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '3px', textDecoration: 'none',
              color: ativo ? '#f97316' : 'rgba(255,255,255,0.45)',
              borderTop: ativo ? '2px solid #f97316' : '2px solid transparent',
              background: ativo ? 'rgba(249,115,22,0.08)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{item.emoji}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: ativo ? 700 : 500, letterSpacing: '0.01em' }}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
