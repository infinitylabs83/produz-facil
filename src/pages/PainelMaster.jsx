import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY || 'Gh102030'

// ── helpers ───────────────────────────────────────────────────────────────────
function diasAtras(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  return `${diff}d atrás`
}
function formatarData(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function diasParaExpirar(dt) {
  if (!dt) return null
  return Math.ceil((new Date(dt) - Date.now()) / 86400000)
}

// ── Tela de senha ─────────────────────────────────────────────────────────────
function TelaSenha({ onEntrar }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro]   = useState('')

  function verificar(e) {
    e.preventDefault()
    if (senha === MASTER_KEY) {
      sessionStorage.setItem('pf_master', '1')
      onEntrar()
    } else {
      setErro('Senha incorreta.')
      setSenha('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '24px' }}>
      <div style={{ background: '#1e293b', borderRadius: '20px', padding: '40px 32px', width: '100%', maxWidth: '360px', border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔐</div>
          <div style={{ color: '#f97316', fontWeight: 800, fontSize: '1.3rem' }}>ProduzFácil</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Painel do Fundador</div>
        </div>
        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
            {erro}
          </div>
        )}
        <form onSubmit={verificar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="password" placeholder="Senha" value={senha}
            onChange={e => setSenha(e.target.value)} autoFocus
            style={{ padding: '14px 16px', borderRadius: '10px', border: '2px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', textAlign: 'center', letterSpacing: '0.1em' }}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = '#334155'}
          />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', fontWeight: 800, fontSize: '1rem', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = {
    ativo:      { label: '🟢 Ativo',       cor: '#16a34a', bg: 'rgba(34,197,94,0.12)'   },
    recente:    { label: '🟡 Recente',     cor: '#a16207', bg: 'rgba(234,179,8,0.12)'   },
    inativo:    { label: '🔴 Inativo',     cor: '#dc2626', bg: 'rgba(239,68,68,0.12)'   },
    nunca_usou: { label: '⚫ Nunca usou', cor: '#475569', bg: 'rgba(100,116,139,0.12)'  },
  }
  const s = m[status] || m.nunca_usou
  return <span style={{ background: s.bg, color: s.cor, fontWeight: 700, fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{s.label}</span>
}

function PlanoBadge({ plano, expiresAt }) {
  const dias = diasParaExpirar(expiresAt)
  const m = {
    trial:     { label: `⏳ Trial${dias != null ? ` (${dias}d)` : ''}`, cor: '#1d4ed8', bg: 'rgba(59,130,246,0.12)'  },
    pago:      { label: '✅ Pago',      cor: '#16a34a', bg: 'rgba(34,197,94,0.12)'   },
    cancelado: { label: '❌ Cancelado', cor: '#dc2626', bg: 'rgba(239,68,68,0.12)'   },
    cortesia:  { label: '🎁 Cortesia', cor: '#ea580c', bg: 'rgba(249,115,22,0.12)'  },
  }
  const p = m[plano] || m.trial
  return <span style={{ background: p.bg, color: p.cor, fontWeight: 700, fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{p.label}</span>
}

// ── Modal alterar plano ───────────────────────────────────────────────────────
function ModalPlano({ empresa, onFechar, onSalvo }) {
  const [plano, setPlano]   = useState(empresa.plano || 'trial')
  const [expira, setExpira] = useState(empresa.trial_expira_em?.slice(0, 10) || '')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.from('empresas').update({ plano, trial_expira_em: expira || null }).eq('id', empresa.id)
    setSalvando(false)
    onSalvo()
  }

  const inp = { padding: '10px 12px', borderRadius: '8px', border: '2px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '0.95rem', fontFamily: 'inherit', width: '100%', outline: 'none' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#1e293b', borderRadius: '16px', width: '100%', maxWidth: '380px', padding: '28px', border: '1px solid #334155' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9', marginBottom: '4px' }}>Alterar plano</div>
        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>{empresa.nome}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Plano</label>
            <select value={plano} onChange={e => setPlano(e.target.value)} style={inp}>
              <option value="trial">Trial (gratuito)</option>
              <option value="pago">Pago</option>
              <option value="cortesia">Cortesia</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          {plano === 'trial' && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Expira em</label>
              <input type="date" value={expira} onChange={e => setExpira(e.target.value)} style={inp} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onFechar} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #334155', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#f97316', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────────────────
function PainelConteudo() {
  const [dados, setDados]           = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]             = useState('')
  const [abaAtiva, setAbaAtiva]     = useState('visao_geral')
  const [modalEmpresa, setModalEmpresa] = useState(null)
  const [atualizadoEm, setAtualizadoEm] = useState(null)

  async function carregar() {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.rpc('get_founder_dashboard_master', { p_key: MASTER_KEY })
    if (error) { setErro(error.message); setCarregando(false); return }
    setDados(data)
    setAtualizadoEm(new Date())
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  function sair() {
    sessionStorage.removeItem('pf_master')
    window.location.reload()
  }

  if (carregando) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: "'Inter', sans-serif", gap: '12px' }}>
      <span style={{ fontSize: '1.5rem' }}>⏳</span> Carregando dados...
    </div>
  )

  if (erro) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
        <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>Erro ao carregar</div>
        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px', background: '#1e293b', padding: '12px', borderRadius: '8px', textAlign: 'left' }}>{erro}</div>
        <button onClick={carregar} style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontWeight: 700 }}>
          Tentar novamente
        </button>
      </div>
    </div>
  )

  const { funil, empresas, leads_recentes } = dados || {}
  const nuncaUsou       = (empresas || []).filter(e => e.status_uso === 'nunca_usou')
  const inativos        = (empresas || []).filter(e => e.status_uso === 'inativo')
  const ativos          = (empresas || []).filter(e => ['ativo', 'recente'].includes(e.status_uso))
  const triaisExpirando = (empresas || []).filter(e => { const d = diasParaExpirar(e.trial_expira_em); return e.plano === 'trial' && d != null && d <= 7 && d >= 0 })

  const card = { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }
  const abas = [
    { key: 'visao_geral', label: '📊 Visão Geral' },
    { key: 'clientes',    label: `🏢 Clientes (${(empresas || []).length})` },
    { key: 'leads',       label: `🎯 Leads (${(leads_recentes || []).length})` },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#f97316', fontWeight: 800, fontSize: '1.1rem' }}>ProduzFácil</span>
            <span style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>Painel do Fundador</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {atualizadoEm && <span style={{ color: '#475569', fontSize: '0.75rem' }}>Atualizado {atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
            <button onClick={carregar} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem' }}>🔄</button>
            <button onClick={sair} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 600 }}>🚪 Sair</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { v: funil?.leads_total,           l: 'Leads total',          cor: '#6366f1' },
            { v: funil?.leads_convertidos,     l: 'Com acesso',           cor: '#f97316' },
            { v: funil?.empresas_com_producao, l: 'Usaram o app',         cor: '#22c55e' },
            { v: funil?.empresas_ativas_7d,    l: 'Ativos (7 dias)',      cor: '#14b8a6' },
            { v: funil?.producoes_total,       l: 'Produções total',      cor: '#8b5cf6' },
          ].map((k, i) => (
            <div key={i} style={{ ...card, textAlign: 'center', borderTop: `3px solid ${k.cor}`, padding: '16px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: k.cor, lineHeight: 1 }}>{k.v ?? '—'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Alertas */}
        {(nuncaUsou.length > 0 || inativos.length > 0 || triaisExpirando.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {nuncaUsou.length > 0 && (
              <div style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid #334155', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: '#94a3b8' }}>⚫ Nunca usaram ({nuncaUsou.length})</div>
                {nuncaUsou.map(e => <div key={e.id} style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>• {e.nome}</div>)}
              </div>
            )}
            {inativos.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: '#fca5a5' }}>🔴 Pararam de usar ({inativos.length})</div>
                {inativos.map(e => <div key={e.id} style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>• {e.nome} · {diasAtras(e.ultima_producao)}</div>)}
              </div>
            )}
            {triaisExpirando.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: '#fcd34d' }}>⏰ Trial expirando ({triaisExpirando.length})</div>
                {triaisExpirando.map(e => <div key={e.id} style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>• {e.nome} · {diasParaExpirar(e.trial_expira_em)}d</div>)}
              </div>
            )}
          </div>
        )}

        {/* Abas */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #334155', marginBottom: '20px', overflowX: 'auto' }}>
          {abas.map(a => (
            <button key={a.key} onClick={() => setAbaAtiva(a.key)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: abaAtiva === a.key ? '#f97316' : '#64748b',
              borderBottom: abaAtiva === a.key ? '2px solid #f97316' : '2px solid transparent',
              marginBottom: '-2px', fontSize: '0.88rem', fontWeight: abaAtiva === a.key ? 700 : 500, whiteSpace: 'nowrap',
            }}>{a.label}</button>
          ))}
        </div>

        {/* ABA: VISÃO GERAL */}
        {abaAtiva === 'visao_geral' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={card}>
              <div style={{ fontWeight: 700, marginBottom: '16px' }}>🔽 Funil de Conversão</div>
              {[
                { label: 'Leads cadastrados',      v: funil?.leads_total,           cor: '#6366f1', max: funil?.leads_total },
                { label: 'Receberam acesso',        v: funil?.leads_convertidos,     cor: '#f97316', max: funil?.leads_total },
                { label: 'Usaram o app',            v: funil?.empresas_com_producao, cor: '#22c55e', max: funil?.leads_convertidos },
                { label: 'Ativos (últimos 7 dias)', v: funil?.empresas_ativas_7d,    cor: '#14b8a6', max: funil?.empresas_com_producao },
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '160px', fontSize: '0.78rem', color: '#64748b', flexShrink: 0 }}>{e.label}</span>
                  <div style={{ flex: 1, height: '24px', background: '#334155', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${e.max ? Math.round((e.v || 0) / e.max * 100) : 0}%`, minWidth: (e.v || 0) > 0 ? '28px' : 0, height: '100%', background: e.cor, borderRadius: '6px', transition: 'width 0.6s' }} />
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', fontWeight: 700, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{e.v || 0}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, marginBottom: '16px' }}>🏢 Status dos Clientes</div>
              {[
                { label: '🟢 Ativos (≤3 dias)',   count: ativos.filter(e => e.status_uso === 'ativo').length,   cor: '#22c55e' },
                { label: '🟡 Recentes (≤7 dias)', count: ativos.filter(e => e.status_uso === 'recente').length, cor: '#eab308' },
                { label: '🔴 Inativos (>7 dias)', count: inativos.length,  cor: '#ef4444' },
                { label: '⚫ Nunca usaram',        count: nuncaUsou.length, cor: '#475569' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid #334155' : 'none' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>{s.label}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: s.cor }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: CLIENTES */}
        {abaAtiva === 'clientes' && (
          <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155' }}>
                  {['Empresa', 'Plano', 'Status', 'Produções', 'Última uso', 'Usuários', 'Desde', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(empresas || []).map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>{e.nome}</td>
                    <td style={{ padding: '14px 16px' }}><PlanoBadge plano={e.plano} expiresAt={e.trial_expira_em} /></td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={e.status_uso} /></td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: e.total_producoes > 0 ? '#22c55e' : '#475569' }}>{e.total_producoes}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>{diasAtras(e.ultima_producao) || '—'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b' }}>{e.total_usuarios}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#475569', fontSize: '0.78rem' }}>{formatarData(e.created_at)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => setModalEmpresa(e)} style={{ background: '#334155', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                        ✏️ Plano
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA: LEADS */}
        {abaAtiva === 'leads' && (
          <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155' }}>
                  {['Data', 'Nome', 'Restaurante', 'E-mail', 'WhatsApp', 'Status'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(leads_recentes || []).map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatarData(l.created_at)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{l.nome || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{l.restaurante || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <a href={`mailto:${l.email}`} style={{ color: '#f97316', textDecoration: 'none', fontSize: '0.85rem' }}>{l.email}</a>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {l.whatsapp ? <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>{l.whatsapp}</a> : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: l.convertido ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)', color: l.convertido ? '#16a34a' : '#ea580c', fontWeight: 700, fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px' }}>
                        {l.convertido ? '✅ Com acesso' : '⏳ Aguardando'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalEmpresa && (
        <ModalPlano empresa={modalEmpresa} onFechar={() => setModalEmpresa(null)} onSalvo={() => { setModalEmpresa(null); carregar() }} />
      )}
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function PainelMaster() {
  const [autenticado, setAutenticado] = useState(sessionStorage.getItem('pf_master') === '1')
  if (!autenticado) return <TelaSenha onEntrar={() => setAutenticado(true)} />
  return <PainelConteudo />
}
