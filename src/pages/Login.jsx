import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [aba, setAba] = useState('entrar')

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

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

  // ── LOGIN ──────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) setErro('E-mail ou senha incorretos. Tente novamente.')
    setCarregando(false)
  }

  // ── CADASTRO ───────────────────────────────────────────────
  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (senha !== confirmaSenha) {
      setErro('As senhas não coincidem. Verifique e tente novamente.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setCarregando(true)

    // 1. Cria o usuário no Supabase Auth
    const { error: erroSignUp } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (erroSignUp) {
      setErro('Erro ao criar conta: ' + erroSignUp.message)
      setCarregando(false)
      return
    }

    // 2. Faz login imediato para obter sessão ativa
    const { data: sessao, error: erroLogin } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (erroLogin || !sessao?.user) {
      // Conta criada mas precisa confirmar e-mail primeiro
      setSucesso('Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.')
      setCarregando(false)
      trocarAba('entrar')
      return
    }

    const userId = sessao.user.id

    // 3. Cria a empresa com o nome informado
    const { data: empresa, error: erroEmpresa } = await supabase
      .from('empresas')
      .insert({ nome: nomeEmpresa.trim() || 'Minha Cozinha' })
      .select()
      .single()

    if (erroEmpresa) {
      setErro('Conta criada, mas erro ao criar a empresa: ' + erroEmpresa.message)
      setCarregando(false)
      return
    }

    // 4. Atualiza o perfil do usuário como gestor e vincula à empresa
    const { error: erroPerfil } = await supabase
      .from('usuarios')
      .update({
        nome: nome.trim() || null,
        perfil: 'gestor',
        empresa_id: empresa.id,
      })
      .eq('id', userId)

    if (erroPerfil) {
      setErro('Conta criada, mas erro ao salvar o perfil: ' + erroPerfil.message)
      setCarregando(false)
      return
    }

    // Tudo certo — o useAuth vai detectar a sessão e redirecionar automaticamente
    setCarregando(false)
  }

  return (
    <div className="login-tela">
      <div className="login-card">

        <div className="login-logo">
          <h1>ProduzFácil</h1>
          <p>CMV — Controle de Custo de Produção</p>
        </div>

        <div className="login-abas">
          <button
            className={aba === 'entrar' ? 'aba-ativa' : ''}
            onClick={() => trocarAba('entrar')}
            type="button"
          >
            Entrar
          </button>
          <button
            className={aba === 'cadastrar' ? 'aba-ativa' : ''}
            onClick={() => trocarAba('cadastrar')}
            type="button"
          >
            Criar conta
          </button>
        </div>

        {erro && <div className="mensagem-erro">{erro}</div>}
        {sucesso && <div className="mensagem-sucesso">{sucesso}</div>}

        {/* ── ENTRAR ── */}
        {aba === 'entrar' && (
          <form onSubmit={handleLogin}>
            <div className="campo-grupo">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="campo-grupo">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primario btn-grande"
              disabled={carregando}
              style={{ marginTop: '8px' }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {/* ── CRIAR CONTA ── */}
        {aba === 'cadastrar' && (
          <form onSubmit={handleCadastro}>
            <div className="campo-grupo">
              <label htmlFor="nome">Seu nome</label>
              <input
                id="nome"
                type="text"
                placeholder="Ex: João Silva"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
            </div>

            <div className="campo-grupo">
              <label htmlFor="nomeEmpresa">Nome do seu negócio</label>
              <input
                id="nomeEmpresa"
                type="text"
                placeholder="Ex: Restaurante da Maria"
                value={nomeEmpresa}
                onChange={e => setNomeEmpresa(e.target.value)}
                required
              />
              <span className="ajuda">Você poderá alterar isso depois.</span>
            </div>

            <div className="campo-grupo">
              <label htmlFor="emailCad">E-mail</label>
              <input
                id="emailCad"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="campo-grupo">
              <label htmlFor="senhaCad">Senha</label>
              <input
                id="senhaCad"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="campo-grupo">
              <label htmlFor="confirmaSenha">Confirmar senha</label>
              <input
                id="confirmaSenha"
                type="password"
                placeholder="Repita a senha"
                value={confirmaSenha}
                onChange={e => setConfirmaSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primario btn-grande"
              disabled={carregando}
              style={{ marginTop: '8px' }}
            >
              {carregando ? 'Criando conta...' : 'Criar minha conta'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>
              Ao criar conta, você será o <strong>gestor</strong> do seu negócio.
            </p>
          </form>
        )}

      </div>
    </div>
  )
}
