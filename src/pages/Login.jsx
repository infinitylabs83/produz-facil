import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Inject Manrope font (same as LP)
function useFonts() {
  useEffect(() => {
    if (document.getElementById('login-fonts')) return
    const link = document.createElement('link')
    link.id = 'login-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

export default function Login() {
  useFonts()
  const [aba, setAba] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  function trocarAba(novaAba) {
    setAba(novaAba)
    setErro('')
    setSucesso('')
    setEmail('')
    setSenha('')
    setNome('')
    setConfirmaSenha('')
    setNomeEmpresa('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos. Tente novamente.')
    setCarregando(false)
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    if (senha !== confirmaSenha) { setErro('As senhas não coincidem.'); return }
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    setCarregando(true)

    const { error: erroSignUp } = await supabase.auth.signUp({ email, password: senha })
    if (erroSignUp) { setErro('Erro ao criar conta: ' + erroSignUp.message); setCarregando(false); return }

    const { data: sessao, error: erroLogin } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (erroLogin || !sessao?.user) {
      setSucesso('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      setCarregando(false)
      trocarAba('entrar')
      return
    }

    const userId = sessao.user.id
    const { data: empresa, error: erroEmpresa } = await supabase
      .from('empresas').insert({ nome: nomeEmpresa.trim() || 'Minha Cozinha' }).select().single()
    if (erroEmpresa) { setErro('Conta criada, mas erro ao criar a empresa: ' + erroEmpresa.message); setCarregando(false); return }

    const { error: erroPerfil } = await supabase.from('usuarios')
      .update({ nome: nome.trim() || null, perfil: 'gestor', empresa_id: empresa.id }).eq('id', userId)
    if (erroPerfil) { setErro('Conta criada, mas erro ao salvar o perfil: ' + erroPerfil.message); setCarregando(false); return }

    setCarregando(false)
  }

  const inputStyle = {
    width: '100%', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '8px', padding: '13px 16px', color: '#f1f5f9',
    fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif', outline: 'none',
    transition: 'border-color 0.15s',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 700,
    color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.02em',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', fontFamily: 'Manrope, sans-serif',
      background: '#0a0f1e',
    }}>
      {/* ── PAINEL ESQUERDO (só desktop) ── */}
      <div style={{
        display: 'none', flex: 1, background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        padding: '60px 48px', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden',
      }} className="login-painel-esq">

        {/* Glow decorativo */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <div style={{
              width: '36px', height: '36px', background: '#f97316', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'white', letterSpacing: '0.08em' }}>ProduzFácil</span>
            <span style={{ color: '#475569', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>CMV</span>
          </div>

          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'white', lineHeight: 0.95, marginBottom: '20px' }}>
            CONTROLE REAL<br />
            <span style={{ color: '#f97316' }}>DE COZINHA</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, maxWidth: '340px' }}>
            Do peso cru ao custo por porção — sem planilha, sem achismo.
          </p>
        </div>

        {/* Benefícios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: '⚖️', texto: 'Perda real calculada por lote' },
            { icon: '📊', texto: 'Dashboard com histórico completo' },
            { icon: '👥', texto: 'Acesso separado por funcionário' },
            { icon: '🏭', texto: 'Comparação entre fornecedores' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
              }}>{b.icon}</div>
              <span style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: 500 }}>{b.texto}</span>
            </div>
          ))}
        </div>

        <div style={{ color: '#334155', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} ProduzFácil CMV
        </div>
      </div>

      {/* ── PAINEL DIREITO — formulário ── */}
      <div style={{
        width: '100%', maxWidth: '480px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
      }} className="login-form-col">

        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Logo mobile (só aparece em telas pequenas) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }} className="login-logo-mobile">
            <div style={{
              width: '32px', height: '32px', background: '#f97316', borderRadius: '7px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'white', letterSpacing: '0.08em' }}>ProduzFácil</span>
            <span style={{ color: '#475569', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>CMV</span>
          </div>

          {/* Título do form */}
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'white', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {aba === 'entrar' ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '28px' }}>
            {aba === 'entrar' ? 'Entre com seu e-mail e senha para acessar.' : 'Configure sua cozinha em menos de 2 minutos.'}
          </p>

          {/* Abas */}
          <div style={{
            display: 'flex', background: '#0f172a', borderRadius: '10px',
            padding: '4px', marginBottom: '24px', gap: '4px', border: '1px solid #1e293b',
          }}>
            {['entrar', 'cadastrar'].map(a => (
              <button key={a} onClick={() => trocarAba(a)} type="button" style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem', fontWeight: 700,
                background: aba === a ? '#1e293b' : 'transparent',
                color: aba === a ? '#f97316' : '#64748b',
                boxShadow: aba === a ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.15s',
              }}>
                {a === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* Mensagens */}
          {erro && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '12px 16px', color: '#fca5a5',
              fontSize: '0.85rem', marginBottom: '20px',
            }}>{erro}</div>
          )}
          {sucesso && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '8px', padding: '12px 16px', color: '#86efac',
              fontSize: '0.85rem', marginBottom: '20px',
            }}>{sucesso}</div>
          )}

          {/* ── FORM ENTRAR ── */}
          {aba === 'entrar' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input
                  type="email" placeholder="seu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
              <div>
                <label style={labelStyle}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••" value={senha}
                    onChange={e => setSenha(e.target.value)} required autoComplete="current-password"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={e => e.target.style.borderColor = '#f97316'}
                    onBlur={e => e.target.style.borderColor = '#334155'}
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px',
                    fontSize: '1rem', lineHeight: 1,
                  }}>
                    {mostrarSenha ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={carregando} style={{
                width: '100%', background: '#f97316', color: 'white', border: 'none',
                borderRadius: '8px', padding: '15px', fontFamily: 'Manrope, sans-serif',
                fontSize: '1rem', fontWeight: 800, cursor: carregando ? 'not-allowed' : 'pointer',
                opacity: carregando ? 0.6 : 1, transition: 'all 0.15s',
                boxShadow: '0 4px 16px rgba(249,115,22,0.3)', marginTop: '4px',
              }}>
                {carregando ? 'Entrando...' : 'Entrar no sistema →'}
              </button>
            </form>
          )}

          {/* ── FORM CADASTRAR ── */}
          {aba === 'cadastrar' && (
            <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Seu nome</label>
                <input type="text" placeholder="Ex: João Silva" value={nome}
                  onChange={e => setNome(e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
              <div>
                <label style={labelStyle}>Nome do seu negócio</label>
                <input type="text" placeholder="Ex: Restaurante da Maria" value={nomeEmpresa}
                  onChange={e => setNomeEmpresa(e.target.value)} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input type="email" placeholder="seu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
              <div>
                <label style={labelStyle}>Senha</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={senha}
                  onChange={e => setSenha(e.target.value)} required autoComplete="new-password" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input type="password" placeholder="Repita a senha" value={confirmaSenha}
                  onChange={e => setConfirmaSenha(e.target.value)} required autoComplete="new-password" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
              <button type="submit" disabled={carregando} style={{
                width: '100%', background: '#f97316', color: 'white', border: 'none',
                borderRadius: '8px', padding: '15px', fontFamily: 'Manrope, sans-serif',
                fontSize: '1rem', fontWeight: 800, cursor: carregando ? 'not-allowed' : 'pointer',
                opacity: carregando ? 0.6 : 1, transition: 'all 0.15s',
                boxShadow: '0 4px 16px rgba(249,115,22,0.3)', marginTop: '4px',
              }}>
                {carregando ? 'Criando conta...' : 'Criar minha conta →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569' }}>
                Você será o <strong style={{ color: '#94a3b8' }}>gestor</strong> da sua empresa.
              </p>
            </form>
          )}

          {/* Voltar para LP */}
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <a href="/produz-facil/" style={{ color: '#475569', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
              ← Voltar ao site
            </a>
          </div>
        </div>
      </div>

      {/* ── Estilos responsivos via <style> ── */}
      <style>{`
        @media (min-width: 900px) {
          .login-painel-esq { display: flex !important; }
          .login-logo-mobile { display: none !important; }
          .login-form-col { max-width: 520px !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  )
}
