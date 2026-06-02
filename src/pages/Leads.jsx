import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const WPP = '5598991289090'

function formatarData(dt) {
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ convertido }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
      background: convertido ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
      color: convertido ? 'var(--cor-sucesso)' : 'var(--cor-primaria)',
    }}>
      {convertido ? '✅ Com acesso' : '⏳ Aguardando'}
    </span>
  )
}

function ModalCriarAcesso({ lead, empresaId, onFechar, onSucesso }) {
  const [perfil, setPerfil] = useState('operador')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')

  async function criar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) { setErro('A senha deve ter pelo menos 8 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não conferem.'); return }

    setCriando(true)

    // 1. Cria o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: lead.email,
      password: senha,
      options: {
        data: { nome: lead.nome },
        emailRedirectTo: `${window.location.origin}/produz-facil/login`,
      }
    })

    if (authError) {
      setCriando(false)
      setErro('Erro ao criar conta: ' + authError.message)
      return
    }

    // 2. Insere perfil na tabela usuarios
    if (authData.user) {
      await supabase.from('usuarios').insert({
        id: authData.user.id,
        empresa_id: empresaId,
        perfil,
        nome: lead.nome,
      })
    }

    // 3. Marca o lead como convertido
    await supabase.from('leads')
      .update({ convertido: true, acesso_criado_em: new Date().toISOString() })
      .eq('id', lead.id)

    setCriando(false)
    onSucesso(lead.id)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--cor-fundo-card)', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>🔑 Criar acesso</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>{lead.nome} · {lead.email}</div>
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cor-texto-suave)', fontSize: '1.3rem' }}>✕</button>
        </div>

        {erro && <div className="mensagem-erro" style={{ marginBottom: '16px' }}>{erro}</div>}

        <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label>Perfil de acesso</label>
            <select value={perfil} onChange={e => setPerfil(e.target.value)}>
              <option value="operador">Operador (apenas registra produções)</option>
              <option value="administrativo">Administrativo (acesso ao dashboard e cadastros)</option>
              <option value="gestor">Gestor (acesso total)</option>
            </select>
          </div>
          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label>Senha inicial</label>
            <input type="password" placeholder="Mínimo 8 caracteres" value={senha} onChange={e => setSenha(e.target.value)} required />
            <span className="ajuda">O usuário poderá alterar depois pelo perfil.</span>
          </div>
          <div className="campo-grupo" style={{ marginBottom: 0 }}>
            <label>Confirmar senha</label>
            <input type="password" placeholder="Repita a senha" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
          </div>

          <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '0.82rem', color: 'var(--cor-texto-suave)', lineHeight: 1.6 }}>
            📧 O Supabase enviará um <strong>e-mail de confirmação</strong> para <strong>{lead.email}</strong> com um link para ativar a conta. Depois de confirmar o e-mail, o usuário já pode acessar o app com a senha definida aqui.
          </div>

          <button className="btn btn-primario" type="submit" disabled={criando} style={{ width: '100%' }}>
            {criando ? '⏳ Criando acesso...' : '✅ Criar acesso e enviar convite'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Leads() {
  const { user } = useAuth()
  const [leads, setLeads]         = useState([])
  const [empresaId, setEmpresaId] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [modalLead, setModalLead] = useState(null)
  const [filtro, setFiltro]       = useState('todos')

  useEffect(() => {
    async function carregar() {
      if (!user) return
      const { data: usuario } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
      setEmpresaId(usuario?.empresa_id)
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      setLeads(data || [])
      setCarregando(false)
    }
    carregar()
  }, [user])

  function aoConvertido(id) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, convertido: true, acesso_criado_em: new Date().toISOString() } : l))
    setModalLead(null)
  }

  const leadsFiltrados = leads.filter(l => {
    if (filtro === 'aguardando') return !l.convertido
    if (filtro === 'convertidos') return !!l.convertido
    return true
  })

  const totalAguardando = leads.filter(l => !l.convertido).length

  if (carregando) return <div className="loading-tela">Carregando leads...</div>

  return (
    <div>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Leads do Beta</h1>
          <p className="pagina-subtitulo">{leads.length} inscrição(ões) · {totalAguardando} aguardando acesso</p>
        </div>
        {totalAguardando > 0 && (
          <div style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid var(--cor-primaria)', borderRadius: '10px', padding: '10px 16px', fontSize: '0.85rem', color: 'var(--cor-primaria)', fontWeight: 700 }}>
            🔔 {totalAguardando} lead(s) aguardando acesso
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'todos', label: `Todos (${leads.length})` },
          { key: 'aguardando', label: `⏳ Aguardando (${totalAguardando})` },
          { key: 'convertidos', label: `✅ Com acesso (${leads.length - totalAguardando})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)} style={{
            padding: '8px 16px', borderRadius: '8px', border: '2px solid',
            borderColor: filtro === f.key ? 'var(--cor-primaria)' : 'var(--cor-borda)',
            background: filtro === f.key ? 'rgba(249,115,22,0.1)' : 'var(--cor-fundo-card)',
            color: filtro === f.key ? 'var(--cor-primaria)' : 'var(--cor-texto-suave)',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {leadsFiltrados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--cor-texto-suave)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
          <div style={{ fontWeight: 600 }}>Nenhum lead ainda</div>
          <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Quando alguém preencher o formulário da landing page, aparecerá aqui.</div>
        </div>
      ) : (
        <div className="card">
          <div className="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nome</th>
                  <th>Restaurante</th>
                  <th>E-mail</th>
                  <th>WhatsApp</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ color: 'var(--cor-texto-suave)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {formatarData(lead.created_at)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{lead.nome || '—'}</td>
                    <td style={{ color: 'var(--cor-texto-suave)' }}>{lead.restaurante || '—'}</td>
                    <td>
                      <a href={`mailto:${lead.email}`} style={{ color: 'var(--cor-primaria)', textDecoration: 'none', fontSize: '0.88rem' }}>
                        {lead.email}
                      </a>
                    </td>
                    <td>
                      {lead.whatsapp ? (
                        <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${lead.nome}! Seu acesso ao ProduzFácil CMV está pronto 🚀`)}`}
                          target="_blank" rel="noreferrer"
                          style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
                          {lead.whatsapp}
                        </a>
                      ) : '—'}
                    </td>
                    <td><StatusBadge convertido={lead.convertido} /></td>
                    <td>
                      {!lead.convertido ? (
                        <button onClick={() => setModalLead(lead)} className="btn btn-primario" style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
                          🔑 Criar acesso
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)' }}>
                          {lead.acesso_criado_em ? formatarData(lead.acesso_criado_em) : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalLead && (
        <ModalCriarAcesso
          lead={modalLead}
          empresaId={empresaId}
          onFechar={() => setModalLead(null)}
          onSucesso={aoConvertido}
        />
      )}
    </div>
  )
}
