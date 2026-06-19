import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const STATUS_LABEL = { excelente: '🏆 Excelente', meta: '✅ Na meta', atencao: '⚠️ Atenção', perda: '❌ Perda alta' }
const STATUS_BG    = {
  excelente: 'rgba(34,197,94,0.15)',  meta: 'rgba(59,130,246,0.15)',
  atencao:   'rgba(245,158,11,0.15)', perda: 'rgba(239,68,68,0.15)',
}
const STATUS_TEXT  = {
  excelente: 'var(--cor-sucesso)', meta: 'var(--cor-info)',
  atencao:   'var(--cor-atencao)', perda: 'var(--cor-perigo)',
}

export default function Historico() {
  const [producoes, setProducoes]   = useState([])
  const [produtos, setProdutos]     = useState([])
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido]   = useState(null)
  const [excluindo, setExcluindo]   = useState(null)

  // Filtros
  const [filtroProduto, setFiltroProduto] = useState('')
  const [filtroStatus, setFiltroStatus]   = useState('')
  const [filtroInicio, setFiltroInicio]   = useState('')
  const [filtroFim, setFiltroFim]         = useState('')

  useEffect(() => {
    supabase.from('produtos').select('id, nome').order('nome').then(({ data }) => setProdutos(data || []))
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase
      .from('producoes')
      .select('*, produtos(nome), fornecedores(nome)')
      .order('created_at', { ascending: false })
      .limit(200)
    setProducoes(data || [])
    setCarregando(false)
  }

  async function excluir(id) {
    if (!window.confirm('Apagar esta produção permanentemente? Esta ação não pode ser desfeita.')) return
    setExcluindo(id)
    await supabase.from('producao_ingredientes').delete().eq('producao_id', id)
    await supabase.from('producoes').delete().eq('id', id)
    setProducoes(prev => prev.filter(p => p.id !== id))
    if (expandido === id) setExpandido(null)
    setExcluindo(null)
  }

  async function excluirTudo() {
    if (!window.confirm('⚠️ ATENÇÃO: Apagar TODAS as produções? Isso não pode ser desfeito.')) return
    if (!window.confirm('Tem certeza absoluta? Todos os registros serão perdidos.')) return
    setCarregando(true)
    // Apaga ingredientes primeiro (FK), depois produções
    const ids = producoes.map(p => p.id)
    for (const id of ids) {
      await supabase.from('producao_ingredientes').delete().eq('producao_id', id)
    }
    await supabase.from('producoes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setProducoes([])
    setCarregando(false)
  }

  const filtradas = producoes.filter(p => {
    if (filtroProduto && p.produto_id !== filtroProduto) return false
    if (filtroStatus && p.status !== filtroStatus) return false
    if (filtroInicio && new Date(p.created_at) < new Date(filtroInicio)) return false
    if (filtroFim && new Date(p.created_at) > new Date(filtroFim + 'T23:59:59')) return false
    return true
  })

  function limparFiltros() {
    setFiltroProduto(''); setFiltroStatus(''); setFiltroInicio(''); setFiltroFim('')
  }

  if (carregando) return <div className="loading-tela">Carregando histórico...</div>

  // ── Dados do gráfico: últimas 30 produções em ordem cronológica ──
  const dadosGrafico = [...filtradas]
    .slice(0, 30)
    .reverse()
    .map(p => ({
      data: new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      'Custo/porção': parseFloat((p.custo_porcao || 0).toFixed(2)),
      'Rendimento %': parseFloat((p.rendimento || 0).toFixed(1)),
    }))

  // ── KPIs rápidos das produções filtradas ──
  const custoMedioPortao = filtradas.length
    ? filtradas.reduce((a, p) => a + (p.custo_porcao || 0), 0) / filtradas.length
    : 0
  const rendimentoMedio = filtradas.length
    ? filtradas.reduce((a, p) => a + (p.rendimento || 0), 0) / filtradas.length
    : 0
  const countStatus = { excelente: 0, meta: 0, atencao: 0, perda: 0 }
  filtradas.forEach(p => { if (p.status) countStatus[p.status] = (countStatus[p.status] || 0) + 1 })

  const nomeProdutoSelecionado = filtroProduto
    ? (produtos.find(p => p.id === filtroProduto)?.nome || '')
    : ''

  return (
    <div>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Histórico de Produções</h1>
          <p className="pagina-subtitulo">{filtradas.length} produção(ões) encontrada(s)</p>
        </div>
        <button
          onClick={excluirTudo}
          className="badge-perigo"
          style={{ border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
        >
          🗑️ Apagar tudo
        </button>
      </div>

      {/* ── Tabs por produto ── */}
      {produtos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setFiltroProduto('')}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: '2px solid',
              borderColor: !filtroProduto ? 'var(--cor-primaria)' : 'var(--cor-borda)',
              background: !filtroProduto ? 'var(--cor-primaria)' : 'transparent',
              color: !filtroProduto ? '#fff' : 'var(--cor-texto-suave)',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s',
            }}
          >
            Todos
          </button>
          {produtos.map(p => (
            <button
              key={p.id}
              onClick={() => setFiltroProduto(p.id)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: '2px solid',
                borderColor: filtroProduto === p.id ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                background: filtroProduto === p.id ? 'var(--cor-primaria)' : 'transparent',
                color: filtroProduto === p.id ? '#fff' : 'var(--cor-texto-suave)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
              }}
            >
              {p.nome}
            </button>
          ))}
        </div>
      )}

      {/* ── KPIs rápidos ── */}
      {filtradas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Custo médio/porção', val: `R$ ${custoMedioPortao.toFixed(2)}`, cor: 'var(--cor-primaria)' },
            { label: 'Rendimento médio', val: `${rendimentoMedio.toFixed(1)}%`, cor: 'var(--cor-sucesso)' },
            { label: 'Excelentes', val: countStatus.excelente, cor: 'var(--cor-sucesso)' },
            { label: 'Na meta', val: countStatus.meta, cor: 'var(--cor-info)' },
            { label: 'Atenção', val: countStatus.atencao, cor: 'var(--cor-atencao)' },
            { label: 'Perda alta', val: countStatus.perda, cor: 'var(--cor-perigo)' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ borderTop: `3px solid ${k.cor}`, padding: '12px 16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: k.cor }}>{k.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Gráfico evolução CMV ── */}
      {dadosGrafico.length >= 2 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div className="card-titulo">
              Evolução: Custo/porção e Rendimento{nomeProdutoSelecionado ? ` — ${nomeProdutoSelecionado}` : ''}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)' }}>
              {filtradas.length > 30 ? 'últimas 30 produções' : `${filtradas.length} produções`} — em ordem cronológica
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dadosGrafico} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradCusto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--cor-borda)" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--cor-texto-suave)' }} />
              <YAxis yAxisId="custo" tick={{ fontSize: 10, fill: 'var(--cor-texto-suave)' }} tickFormatter={v => `R$${v}`} />
              <YAxis yAxisId="rend" orientation="right" tick={{ fontSize: 10, fill: '#22c55e' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.82rem' }}
                formatter={(v, name) => name === 'Custo/porção' ? [`R$ ${v}`, name] : [`${v}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '8px' }} />
              <Area yAxisId="custo" type="monotone" dataKey="Custo/porção" stroke="#f97316" strokeWidth={2.5} fill="url(#gradCusto)" dot={false} activeDot={{ r: 5 }} />
              <Area yAxisId="rend"  type="monotone" dataKey="Rendimento %" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradRend)"  dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="campo-grupo" style={{ marginBottom: 0, flex: '1', minWidth: '140px' }}>
            <label>Status</label>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="excelente">🏆 Excelente</option>
              <option value="meta">✅ Na meta</option>
              <option value="atencao">⚠️ Atenção</option>
              <option value="perda">❌ Perda alta</option>
            </select>
          </div>
          <div className="campo-grupo" style={{ marginBottom: 0, minWidth: '140px' }}>
            <label>Data início</label>
            <input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} />
          </div>
          <div className="campo-grupo" style={{ marginBottom: 0, minWidth: '140px' }}>
            <label>Data fim</label>
            <input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)} />
          </div>
          <button className="btn btn-secundario" onClick={limparFiltros} style={{ padding: '10px 16px' }}>
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th className="col-esconder-mobile">Fornecedor</th>
                <th>Rendimento</th>
                <th className="col-esconder-mobile">Custo/kg</th>
                <th>Custo/porção</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(p => (
                <>
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      <div style={{ fontSize: '0.75rem' }}>{new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.produtos?.nome || '—'}</td>
                    <td className="col-esconder-mobile" style={{ color: 'var(--cor-texto-suave)' }}>{p.fornecedores?.nome || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: parseFloat(p.rendimento) >= 70 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)' }}>
                        {parseFloat(p.rendimento || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="col-esconder-mobile">R$ {parseFloat(p.custo_por_kg_pronto || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--cor-primaria)' }}>
                      R$ {parseFloat(p.custo_porcao || 0).toFixed(2)}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: STATUS_BG[p.status] || 'rgba(100,116,139,0.1)',
                        color: STATUS_TEXT[p.status] || 'var(--cor-texto-suave)',
                      }}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => excluir(p.id)}
                        disabled={excluindo === p.id}
                        title="Apagar produção"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cor-texto-suave)', fontSize: '1rem', padding: '4px 6px', borderRadius: '6px' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--cor-perigo)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--cor-texto-suave)'}
                      >
                        {excluindo === p.id ? '...' : '🗑️'}
                      </button>
                      <span style={{ color: 'var(--cor-texto-suave)', marginLeft: '4px' }}>
                        {expandido === p.id ? '▲' : '▼'}
                      </span>
                    </td>
                  </tr>

                  {/* Linha expandida */}
                  {expandido === p.id && (
                    <tr key={p.id + '_detalhe'}>
                      <td colSpan={8} style={{ background: 'var(--cor-fundo)', padding: 0 }}>
                        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                          <DetalheItem label="Peso cru"     valor={`${parseFloat(p.peso_cru_kg || 0).toFixed(3)} kg`} />
                          <DetalheItem label="Após limpeza" valor={`${parseFloat(p.peso_apos_limpeza_kg || 0).toFixed(3)} kg`} />
                          <DetalheItem label="Peso pronto"  valor={`${parseFloat(p.peso_pronto_kg || 0).toFixed(3)} kg`} />
                          <DetalheItem label="Perda total"  valor={`${parseFloat(p.perda_total_kg || 0).toFixed(3)} kg (${parseFloat(p.percentual_perda || 0).toFixed(1)}%)`} />
                          <DetalheItem label="Perda limpeza" valor={`${parseFloat(p.perda_limpeza_kg || 0).toFixed(3)} kg`} />
                          <DetalheItem label="Perda preparo" valor={`${parseFloat(p.perda_preparo_kg || 0).toFixed(3)} kg`} />
                          <DetalheItem label="Custo total"   valor={`R$ ${parseFloat(p.custo_total || 0).toFixed(2)}`} />
                          <DetalheItem label="Custo por grama" valor={`R$ ${(parseFloat(p.custo_por_kg_pronto || 0) / 1000).toFixed(4)}`} />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}

              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--cor-texto-suave)' }}>
                    Nenhuma produção encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DetalheItem({ label, valor }) {
  return (
    <div style={{ background: 'var(--cor-fundo-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--cor-borda)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--cor-texto-suave)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{valor}</div>
    </div>
  )
}
