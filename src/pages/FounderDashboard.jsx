import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── componentes ──────────────────────────────────────────────────────────────

function KpiCard({ valor, label, sublabel, cor }) {
  return (
    <div style={{
      background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)',
      borderRadius: '12px', padding: '20px', textAlign: 'center',
      borderTop: `3px solid ${cor || 'var(--cor-primaria)'}`,
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: cor || 'var(--cor-texto)', lineHeight: 1 }}>
        {valor ?? '—'}
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '6px', color: 'var(--cor-texto)' }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '3px' }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const mapa = {
    ativo:       { label: '🟢 Ativo',       bg: 'rgba(34,197,94,0.12)',  cor: '#16a34a' },
    recente:     { label: '🟡 Recente',     bg: 'rgba(234,179,8,0.12)',  cor: '#a16207' },
    inativo:     { label: '🔴 Inativo',     bg: 'rgba(239,68,68,0.12)',  cor: '#dc2626' },
    nunca_usou:  { label: '⚫ Nunca usou', bg: 'rgba(100,116,139,0.12)', cor: '#475569' },
  }
  const s = mapa[status] || mapa['nunca_usou']
  return (
    <span style={{
      background: s.bg, color: s.cor, fontWeight: 700, fontSize: '0.72rem',
      padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function PlanoBadge({ plano, expiresAt }) {
  const dias = diasParaExpirar(expiresAt)
  const mapa = {
    trial:     { label: `Trial${dias != null ? ` (${dias}d)` : ''}`, bg: 'rgba(59,130,246,0.12)', cor: '#1d4ed8' },
    pago:      { label: '✅ Pago',      bg: 'rgba(34,197,94,0.12)',  cor: '#16a34a' },
    cancelado: { label: '❌ Cancelado', bg: 'rgba(239,68,68,0.12)',  cor: '#dc2626' },
    cortesia:  { label: '🎁 Cortesia', bg: 'rgba(249,115,22,0.12)',  cor: '#ea580c' },
  }
  const p = mapa[plano] || mapa['trial']
  return (
    <span style={{
      background: p.bg, color: p.cor, fontWeight: 700, fontSize: '0.72rem',
      padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
    }}>
      {p.label}
    </span>
  )
}

function Funil({ funil }) {
  if (!funil) return null
  const etapas = [
    { label: 'Leads cadastrados',      valor: funil.leads_total,           cor: '#6366f1', pct: 100 },
    { label: 'Receberam acesso',        valor: funil.leads_convertidos,     cor: '#f97316', pct: funil.leads_total ? Math.round(funil.leads_convertidos / funil.leads_total * 100) : 0 },
    { label: 'Fizeram 1ª produção',     valor: funil.empresas_com_producao, cor: '#22c55e', pct: funil.leads_convertidos ? Math.round(funil.empresas_com_producao / funil.leads_convertidos * 100) : 0 },
    { label: 'Ativos (últimos 7 dias)', valor: funil.empresas_ativas_7d,    cor: '#14b8a6', pct: funil.empresas_com_producao ? Math.round(funil.empresas_ativas_7d / funil.empresas_com_producao * 100) : 0 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {etapas.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '180px', fontSize: '0.82rem', color: 'var(--cor-texto-suave)', flexShrink: 0 }}>
            {e.label}
          </div>
          <div style={{ flex: 1, height: '28px', background: 'var(--cor-borda)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${e.pct}%`, height: '100%', background: e.cor,
              borderRadius: '6px', transition: 'width 0.6s ease',
              minWidth: e.valor > 0 ? '32px' : '0',
            }} />
            <span style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.78rem', fontWeight: 700, color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
              {e.valor}
            </span>
          </div>
          <div style={{ width: '40px', textAlign: 'right', fontSize: '0.78rem', color: 'var(--cor-texto-suave)', flexShrink: 0 }}>
            {i > 0 ? `${e.pct}%` : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Modal alterar plano ───────────────────────────────────────────────────────
function ModalPlano({ empresa, onFechar, onSalvo }) {
  const [plano, setPlano] = useState(empresa.plano || 'trial')
  const [trial_expira_em, setTrialExpira] = useState(
    empresa.trial_expira_em ? empresa.trial_expira_em.slice(0, 10) : ''
  )
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await supabase.from('empresas').update({ plano, trial_expira_em: trial_expira_em || null }).eq('id', empresa.id)
    setSalvando(false)
    onSalvo()
  }

  const inputStyle = {
    padding: '10px 12px', borderRadius: '8px', border: '2px solid var(--cor-borda)',
    background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '0.95rem',
    fontFamily: 'inherit', width: '100%',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--cor-fundo-card)', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>Alterar plano</div>
        <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem', marginBottom: '20px' }}>{empresa.nome}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Plano</label>
            <select value={plano} onChange={e => setPlano(e.target.value)} style={inputStyle}>
              <option value="trial">Trial (gratuito)</option>
              <option value="pago">Pago</option>
              <option value="cortesia">Cortesia</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          {plano === 'trial' && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Trial expira em</label>
              <input type="date" value={trial_expira_em} onChange={e => setTrialExpira(e.target.value)} style={inputStyle} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onFechar} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid var(--cor-borda)', background: 'transparent', color: 'var(--cor-texto-suave)', cursor: 'pointer', fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#f97316', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function FounderDashboard() {
  const [dados, setDados]           = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]             = useState('')
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const [modalEmpresa, setModalEmpresa] = useState(null)
  const [abaAtiva, setAbaAtiva]     = useState('visao_geral')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.rpc('get_founder_dashboard')
    if (error) { setErro(error.message); setCarregando(false); return }
    setDados(data)
    setAtualizadoEm(new Date())
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (carregando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--cor-texto-suave)' }}>
      <span style={{ fontSize: '1.5rem' }}>⏳</span> Carregando painel do fundador...
    </div>
  )

  if (erro) return (
    <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
      <div style={{ fontWeight: 700, marginBottom: '8px', color: '#ef4444' }}>Erro ao carregar dados</div>
      <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem', marginBottom: '20px' }}>{erro}</div>
      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', padding: '16px', fontSize: '0.85rem', color: 'var(--cor-texto-suave)', marginBottom: '20px', textAlign: 'left' }}>
        <strong>Se for "Access denied":</strong> execute o arquivo <code>supabase/founder_dashboard.sql</code> no SQL Editor do Supabase.
      </div>
      <button onClick={carregar} style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontWeight: 700 }}>
        Tentar novamente
      </button>
    </div>
  )

  const { funil, empresas, leads_recentes, ranking_produtos, atividade_diaria } = dados || {}

  // Alertas
  const nuncaUsou  = (empresas || []).filter(e => e.status_uso === 'nunca_usou')
  const inativos   = (empresas || []).filter(e => e.status_uso === 'inativo')
  const ativos     = (empresas || []).filter(e => e.status_uso === 'ativo' || e.status_uso === 'recente')
  const triaisExpirando = (empresas || []).filter(e => {
    const d = diasParaExpirar(e.trial_expira_em)
    return e.plano === 'trial' && d != null && d <= 7 && d >= 0
  })

  const abas = [
    { key: 'visao_geral', label: '📊 Visão Geral' },
    { key: 'empresas',    label: `🏢 Empresas (${(empresas || []).length})` },
    { key: 'leads',       label: `🎯 Leads (${(leads_recentes || []).length})` },
    { key: 'produtos',    label: '📦 Produtos' },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            🚀 Painel do Fundador
          </h1>
          <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Visão completa do SaaS · {atualizadoEm && `Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button onClick={carregar} style={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: 'var(--cor-texto)', fontWeight: 600, fontSize: '0.85rem' }}>
          🔄 Atualizar
        </button>
      </div>

      {/* KPIs rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <KpiCard valor={funil?.leads_total}           label="Leads total"            cor="#6366f1" />
        <KpiCard valor={funil?.leads_convertidos}     label="Com acesso"             cor="#f97316" />
        <KpiCard valor={funil?.empresas_com_producao} label="Fizeram produção"       cor="#22c55e" />
        <KpiCard valor={funil?.empresas_ativas_7d}    label="Ativos (7 dias)"        cor="#14b8a6" />
        <KpiCard valor={funil?.producoes_total}       label="Produções total"        cor="#8b5cf6" />
      </div>

      {/* Alertas */}
      {(nuncaUsou.length > 0 || inativos.length > 0 || triaisExpirando.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {nuncaUsou.length > 0 && (
            <div style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>⚫ Nunca usaram ({nuncaUsou.length})</div>
              {nuncaUsou.map(e => (
                <div key={e.id} style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)', marginBottom: '4px' }}>• {e.nome}</div>
              ))}
            </div>
          )}
          {inativos.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: '#dc2626' }}>🔴 Pararam de usar ({inativos.length})</div>
              {inativos.map(e => (
                <div key={e.id} style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)', marginBottom: '4px' }}>• {e.nome} · {diasAtras(e.ultima_producao)}</div>
              ))}
            </div>
          )}
          {triaisExpirando.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: '#a16207' }}>⏰ Trial expirando ({triaisExpirando.length})</div>
              {triaisExpirando.map(e => (
                <div key={e.id} style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)', marginBottom: '4px' }}>• {e.nome} · {diasParaExpirar(e.trial_expira_em)}d restantes</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid var(--cor-borda)', overflowX: 'auto' }}>
        {abas.map(a => (
          <button key={a.key} onClick={() => setAbaAtiva(a.key)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontWeight: abaAtiva === a.key ? 700 : 500,
            color: abaAtiva === a.key ? 'var(--cor-primaria)' : 'var(--cor-texto-suave)',
            borderBottom: abaAtiva === a.key ? '2px solid var(--cor-primaria)' : '2px solid transparent',
            marginBottom: '-2px', fontSize: '0.9rem', whiteSpace: 'nowrap',
          }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── ABA: VISÃO GERAL ── */}
      {abaAtiva === 'visao_geral' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Funil */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '16px' }}>🔽 Funil de Conversão</div>
            <Funil funil={funil} />
          </div>

          {/* Atividade recente */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '16px' }}>📅 Atividade (últimos 30 dias)</div>
            {(atividade_diaria || []).length === 0
              ? <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>Nenhuma produção nos últimos 30 dias</div>
              : (atividade_diaria || []).slice(-14).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', width: '60px', flexShrink: 0 }}>
                    {new Date(d.dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <div style={{ flex: 1, height: '18px', background: 'var(--cor-borda)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, d.producoes * 10)}%`, minWidth: d.producoes > 0 ? '24px' : 0, height: '100%', background: '#f97316', borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', width: '30px', textAlign: 'right' }}>{d.producoes}</span>
                </div>
              ))
            }
          </div>

          {/* Resumo por status */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '16px' }}>🏢 Status das Empresas</div>
            {[
              { label: '🟢 Ativas (≤3 dias)',    count: ativos.filter(e => e.status_uso === 'ativo').length,    cor: '#22c55e' },
              { label: '🟡 Recentes (≤7 dias)',  count: ativos.filter(e => e.status_uso === 'recente').length,  cor: '#eab308' },
              { label: '🔴 Inativas (>7 dias)',  count: inativos.length,  cor: '#ef4444' },
              { label: '⚫ Nunca usaram',         count: nuncaUsou.length, cor: '#64748b' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--cor-borda)' : 'none' }}>
                <span style={{ fontSize: '0.9rem' }}>{s.label}</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: s.cor }}>{s.count}</span>
              </div>
            ))}
          </div>

          {/* Top produtos */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '16px' }}>📦 Produtos Mais Produzidos</div>
            {(ranking_produtos || []).length === 0
              ? <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>Nenhuma produção registrada ainda</div>
              : (ranking_produtos || []).slice(0, 5).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '22px', height: '22px', background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600 }}>{p.nome}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>{p.total_producoes}×</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── ABA: EMPRESAS ── */}
      {abaAtiva === 'empresas' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Produções</th>
                  <th>Última produção</th>
                  <th>Usuários</th>
                  <th>Desde</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(empresas || []).map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.nome}</td>
                    <td><PlanoBadge plano={e.plano} expiresAt={e.trial_expira_em} /></td>
                    <td><StatusBadge status={e.status_uso} /></td>
                    <td style={{ fontWeight: 700, textAlign: 'center' }}>
                      <span style={{ color: e.total_producoes > 0 ? 'var(--cor-sucesso)' : 'var(--cor-texto-suave)' }}>
                        {e.total_producoes}
                      </span>
                    </td>
                    <td style={{ color: 'var(--cor-texto-suave)', fontSize: '0.82rem' }}>
                      {e.ultima_producao ? diasAtras(e.ultima_producao) : '—'}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--cor-texto-suave)' }}>{e.total_usuarios}</td>
                    <td style={{ color: 'var(--cor-texto-suave)', fontSize: '0.8rem' }}>{formatarData(e.created_at)}</td>
                    <td>
                      <button onClick={() => setModalEmpresa(e)} style={{
                        background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)',
                        borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                        fontSize: '0.78rem', color: 'var(--cor-texto)', fontWeight: 600,
                      }}>
                        ✏️ Plano
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABA: LEADS ── */}
      {abaAtiva === 'leads' && (
        <div className="card" style={{ padding: 0 }}>
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
                </tr>
              </thead>
              <tbody>
                {(leads_recentes || []).map(l => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--cor-texto-suave)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatarData(l.created_at)}</td>
                    <td style={{ fontWeight: 600 }}>{l.nome || '—'}</td>
                    <td style={{ color: 'var(--cor-texto-suave)' }}>{l.restaurante || '—'}</td>
                    <td>
                      <a href={`mailto:${l.email}`} style={{ color: 'var(--cor-primaria)', textDecoration: 'none', fontSize: '0.85rem' }}>
                        {l.email}
                      </a>
                    </td>
                    <td>
                      {l.whatsapp
                        ? <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                            style={{ color: '#25D366', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                            {l.whatsapp}
                          </a>
                        : '—'}
                    </td>
                    <td>
                      <span style={{
                        background: l.convertido ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)',
                        color: l.convertido ? '#16a34a' : '#ea580c',
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

      {/* ── ABA: PRODUTOS ── */}
      {abaAtiva === 'produtos' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produto</th>
                  <th>Total produções</th>
                  <th>Empresas usando</th>
                  <th>Rendimento médio</th>
                  <th>Custo/porção médio</th>
                </tr>
              </thead>
              <tbody>
                {(ranking_produtos || []).map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--cor-texto-suave)', textAlign: 'center' }}>
                      <span style={{ width: '24px', height: '24px', background: i < 3 ? '#f97316' : 'var(--cor-borda)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: i < 3 ? 'white' : 'var(--cor-texto-suave)', fontWeight: 800, fontSize: '0.75rem' }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.nome}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--cor-primaria)' }}>{p.total_producoes}</td>
                    <td style={{ textAlign: 'center', color: 'var(--cor-texto-suave)' }}>{p.empresas_usando}</td>
                    <td style={{ textAlign: 'center' }}>
                      {p.rendimento_medio != null
                        ? <span style={{ color: p.rendimento_medio >= 70 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {Number(p.rendimento_medio).toFixed(1)}%
                          </span>
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--cor-texto-suave)' }}>
                      {p.custo_porcao_medio != null
                        ? `R$ ${Number(p.custo_porcao_medio).toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal alterar plano */}
      {modalEmpresa && (
        <ModalPlano
          empresa={modalEmpresa}
          onFechar={() => setModalEmpresa(null)}
          onSalvo={() => { setModalEmpresa(null); carregar() }}
        />
      )}
    </div>
  )
}
