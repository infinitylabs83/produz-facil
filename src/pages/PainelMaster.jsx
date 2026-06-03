import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY || 'produzfacil@master2026'
const SESSION_KEY = 'pf_master_auth'

// ── helpers ──────────────────────────────────────────────────────────────────
function diasAtras(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  if (diff < 7) return `${diff} dias atrás`
  if (diff < 30) return `${Math.floor(diff / 7)} sem. atrás`
  return `${Math.floor(diff / 30)} mês(es) atrás`
}
function diasParaExpirar(dt) {
  if (!dt) return null
  return Math.ceil((new Date(dt) - Date.now()) / 86400000)
}
function formatarData(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Tela de login ─────────────────────────────────────────────────────────────
function TelaLogin({ onLogin }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro]   = useState(false)

  function tentar(e) {
    e.preventDefault()
    if (senha === MASTER_KEY) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onLogin()
    } else {
      setErro(true)
      setSenha('')
      setTimeout(() => setErro(false), 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: '#1e293b', borderRadius: '20px', padding: '40px 32px',
        width: '100%', maxWidth: '380px', border: '1px solid #334155',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔐</div>
          <div style={{ color: '#f97316', fontWeight: 800, fontSize: '1.3rem' }}>ProduzFácil</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Painel Master — Acesso restrito</div>
        </div>

        <form onSubmit={tentar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="password"
            placeholder="Senha master"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            autoFocus
            style={{
              padding: '14px 16px', borderRadius: '10px',
              border: `2px solid ${erro ? '#ef4444' : '#334155'}`,
              background: '#0f172a', color: '#f1f5f9', fontSize: '1rem',
              fontFamily: 'inherit', outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          {erro && (
            <div style={{ color: '#fca5a5', fontSize: '0.85rem', textAlign: 'center' }}>
              Senha incorreta. Tente novamente.
            </div>
          )}
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white', fontWeight: 700, fontSize: '1rem',
            padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          }}>
            Acessar painel
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Cards KPI ─────────────────────────────────────────────────────────────────
function Kpi({ valor, label, cor, emoji }) {
  return (
    <div style={{
      background: '#1e293b', borderRadius: '12px', padding: '20px',
      borderTop: `3px solid ${cor}`, border: '1px solid #334155',
      borderTopColor: cor,
    }}>
      <div style={{ fontSize: '2rem', lineHeight: 1, fontWeight: 800, color: cor }}>{valor ?? '—'}</div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
        {emoji} {label}
      </div>
    </div>
  )
}

// ── Badge status ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = {
    ativo:      { label: '🟢 Ativo',       cor: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    recente:    { label: '🟡 Recente',     cor: '#eab308', bg: 'rgba(234,179,8,0.1)' },
    inativo:    { label: '🔴 Parou',       cor: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    nunca_usou: { label: '⚫ Nunca usou', cor: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  }
  const s = m[status] || m.nunca_usou
  return (
    <span style={{
      background: s.bg, color: s.cor, fontWeight: 700,
      fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px',
    }}>
      {s.label}
    </span>
  )
}

// ── Barra de frequência visual ────────────────────────────────────────────────
function FreqBar({ valor, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0
  const cor  = pct >= 60 ? '#22c55e' : pct >= 30 ? '#f97316' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', width: '20px', textAlign: 'right' }}>{valor}</span>
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────────────────
function PainelConteudo() {
  const [dados, setDados]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState('')
  const [aba, setAba]         = useState('resumo')
  const [atualizadoEm, setAtualizadoEm] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    const { data, error } = await supabase.rpc('get_founder_dashboard')
    if (error) { setErro(error.message); setLoading(false); return }
    setDados(data)
    setAtualizadoEm(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function sair() {
    sessionStorage.removeItem(SESSION_KEY)
    window.location.reload()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b', fontFamily: "'Inter', sans-serif", background: '#0f172a', gap: '12px' }}>
      <span style={{ fontSize: '1.5rem' }}>⏳</span> Carregando dados...
    </div>
  )

  if (erro) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%', border: '1px solid #334155' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
        <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>Erro ao carregar</div>
        <div style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' }}>{erro}</div>
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '14px', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '20px' }}>
          <strong style={{ color: '#93c5fd' }}>Se aparecer "Acesso negado":</strong><br />
          Execute o arquivo <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>supabase/founder_dashboard.sql</code> no SQL Editor do Supabase.
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={carregar} style={{ flex: 1, background: '#f97316', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            🔄 Tentar novamente
          </button>
          <button onClick={sair} style={{ padding: '12px 16px', background: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </div>
    </div>
  )

  const { funil, empresas = [], leads_recentes = [] } = dados || {}

  // Cálculos de uso
  const maxProducoes = Math.max(...empresas.map(e => Number(e.total_producoes) || 0), 1)
  const ativos       = empresas.filter(e => e.status_uso === 'ativo')
  const recentes     = empresas.filter(e => e.status_uso === 'recente')
  const inativos     = empresas.filter(e => e.status_uso === 'inativo')
  const nuncaUsou    = empresas.filter(e => e.status_uso === 'nunca_usou')
  const triaisExpir  = empresas.filter(e => {
    const d = diasParaExpirar(e.trial_expira_em)
    return e.plano === 'trial' && d != null && d <= 7 && d >= 0
  })

  const taxaAtivacao = funil?.leads_convertidos > 0
    ? Math.round((funil.empresas_com_producao / funil.leads_convertidos) * 100)
    : 0

  const abas = [
    { key: 'resumo',  label: '📊 Resumo' },
    { key: 'clientes', label: `🏢 Clientes (${empresas.length})` },
    { key: 'leads',   label: `🎯 Leads (${leads_recentes.length})` },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#f1f5f9' }}>

      {/* Header */}
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#f97316', fontWeight: 800, fontSize: '1.1rem' }}>ProduzFácil</span>
            <span style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Painel Master
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {atualizadoEm && (
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                Atualizado {atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={carregar} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #334155', borderRadius: '8px', padding: '7px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
              🔄 Atualizar
            </button>
            <button onClick={sair} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '7px 14px', color: '#fca5a5', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Alertas urgentes */}
        {(triaisExpir.length > 0 || inativos.length > 0 || nuncaUsou.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {triaisExpir.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '10px', fontSize: '0.88rem' }}>
                  ⏰ Trial expirando em até 7 dias ({triaisExpir.length})
                </div>
                {triaisExpir.map(e => (
                  <div key={e.id} style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{e.nome}</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>{diasParaExpirar(e.trial_expira_em)}d</span>
                  </div>
                ))}
              </div>
            )}
            {inativos.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '10px', fontSize: '0.88rem' }}>
                  🔴 Pararam de usar ({inativos.length})
                </div>
                {inativos.map(e => (
                  <div key={e.id} style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{e.nome}</span>
                    <span>{diasAtras(e.ultima_producao)}</span>
                  </div>
                ))}
              </div>
            )}
            {nuncaUsou.length > 0 && (
              <div style={{ background: 'rgba(100,116,139,0.07)', border: '1px solid rgba(100,116,139,0.35)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '10px', fontSize: '0.88rem' }}>
                  ⚫ Receberam acesso mas nunca usaram ({nuncaUsou.length})
                </div>
                {nuncaUsou.map(e => (
                  <div key={e.id} style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '5px' }}>
                    • {e.nome} — desde {formatarData(e.created_at)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          <Kpi valor={funil?.leads_total}           label="Leads captados"        cor="#6366f1" emoji="🎯" />
          <Kpi valor={funil?.leads_convertidos}     label="Receberam acesso"      cor="#f97316" emoji="🔑" />
          <Kpi valor={funil?.empresas_com_producao} label="Usaram pelo menos 1x"  cor="#22c55e" emoji="✅" />
          <Kpi valor={ativos.length}                label="Ativos (últimos 3 dias)" cor="#14b8a6" emoji="🟢" />
          <Kpi valor={`${taxaAtivacao}%`}           label="Taxa de ativação"      cor="#a78bfa" emoji="📈" />
          <Kpi valor={funil?.producoes_total}       label="Total de produções"    cor="#fb923c" emoji="📦" />
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #334155', marginBottom: '20px' }}>
          {abas.map(a => (
            <button key={a.key} onClick={() => setAba(a.key)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontWeight: aba === a.key ? 700 : 500,
              color: aba === a.key ? '#f97316' : '#64748b',
              borderBottom: aba === a.key ? '2px solid #f97316' : '2px solid transparent',
              marginBottom: '-2px', fontSize: '0.9rem', whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ── ABA RESUMO ── */}
        {aba === 'resumo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            {/* Funil visual */}
            <div style={{ background: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
              <div style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.95rem' }}>🔽 Funil de conversão</div>
              {[
                { label: 'Leads captados na LP',    valor: funil?.leads_total,           cor: '#6366f1' },
                { label: 'Receberam acesso',         valor: funil?.leads_convertidos,     cor: '#f97316' },
                { label: 'Fizeram ao menos 1 uso',  valor: funil?.empresas_com_producao, cor: '#22c55e' },
                { label: 'Ativos nos últimos 7 dias', valor: funil?.empresas_ativas_7d,  cor: '#14b8a6' },
              ].map((e, i) => {
                const base = funil?.leads_total || 1
                const pct  = Math.round((e.valor / base) * 100)
                return (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{e.label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: e.cor }}>{e.valor} {i > 0 && `· ${pct}%`}</span>
                    </div>
                    <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: e.cor, borderRadius: '4px', transition: 'width 0.6s' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Distribuição de status */}
            <div style={{ background: '#1e293b', borderRadius: '14px', padding: '24px', border: '1px solid #334155' }}>
              <div style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.95rem' }}>📡 Pulso dos clientes</div>
              {[
                { label: 'Ativos (≤ 3 dias)',       count: ativos.length,   cor: '#22c55e', desc: 'Usando regularmente' },
                { label: 'Recentes (≤ 7 dias)',     count: recentes.length, cor: '#eab308', desc: 'Usaram essa semana' },
                { label: 'Inativos (> 7 dias)',     count: inativos.length, cor: '#ef4444', desc: 'Precisam de atenção' },
                { label: 'Nunca usaram',            count: nuncaUsou.length,cor: '#475569', desc: 'Risco de churn' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: i < 3 ? '1px solid #1e293b' : 'none' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.cor, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.desc}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: s.cor }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ABA CLIENTES ── */}
        {aba === 'clientes' && (
          <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Empresa', 'Status', 'Plano', 'Freq. de uso', 'Última atividade', 'Usuários', 'Desde'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', borderBottom: '1px solid #334155' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: i < empresas.length - 1 ? '1px solid #1e293b' : 'none' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>{e.nome}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={e.status_uso} /></td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: e.plano === 'pago' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                          color: e.plano === 'pago' ? '#22c55e' : '#60a5fa',
                          fontWeight: 700, fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px',
                        }}>
                          {e.plano === 'pago' ? '✅ Pago' : `Trial${diasParaExpirar(e.trial_expira_em) != null ? ` · ${diasParaExpirar(e.trial_expira_em)}d` : ''}`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                        <FreqBar valor={Number(e.total_producoes) || 0} max={maxProducoes} />
                      </td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {e.ultima_producao ? diasAtras(e.ultima_producao) : <span style={{ color: '#475569' }}>Nunca</span>}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8' }}>{e.total_usuarios}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatarData(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ABA LEADS ── */}
        {aba === 'leads' && (
          <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Data', 'Nome', 'Restaurante', 'E-mail', 'WhatsApp', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads_recentes.map((l, i) => (
                    <tr key={l.id} style={{ borderBottom: i < leads_recentes.length - 1 ? '1px solid #1e293b' : 'none' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatarData(l.created_at)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{l.nome || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{l.restaurante || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <a href={`mailto:${l.email}`} style={{ color: '#f97316', textDecoration: 'none' }}>{l.email}</a>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {l.whatsapp
                          ? <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>{l.whatsapp}</a>
                          : <span style={{ color: '#475569' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: l.convertido ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)',
                          color: l.convertido ? '#22c55e' : '#f97316',
                          fontWeight: 700, fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px',
                        }}>
                          {l.convertido ? '✅ Com acesso' : '⏳ Aguardando'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente raiz com controle de autenticação ──────────────────────────────
export default function PainelMaster() {
  const [autenticado, setAutenticado] = useState(
    sessionStorage.getItem(SESSION_KEY) === '1'
  )
  if (!autenticado) return <TelaLogin onLogin={() => setAutenticado(true)} />
  return <PainelConteudo />
}
