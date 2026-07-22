import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { supabase } from '../lib/supabase'
import MetricCard from '../components/MetricCard'

// ─── FUNÇÃO DE DIAGNÓSTICO ───
// Compara a produção mais recente contra o histórico do mesmo produto
function diagnosticar(producoesProd) {
  if (producoesProd.length < 3) return null // histórico insuficiente
  const atual    = producoesProd[0]
  const historico = producoesProd.slice(1, 7) // últimas 6 excluindo a atual

  const pct = (num, den) => den > 0 ? (num / den) * 100 : 0

  const limpAtual = pct(atual.perda_limpeza_kg || 0, atual.peso_cru_kg || 1)
  const limpHist  = historico.reduce((a, p) => a + pct(p.perda_limpeza_kg || 0, p.peso_cru_kg || 1), 0) / historico.length

  const prepAtual = pct(atual.perda_preparo_kg || 0, atual.peso_apos_limpeza_kg || 1)
  const prepHist  = historico.reduce((a, p) => a + pct(p.perda_preparo_kg || 0, p.peso_apos_limpeza_kg || 1), 0) / historico.length

  const custoAtual = atual.custo_por_kg_pronto || 0
  const custoHist  = historico.reduce((a, p) => a + (p.custo_por_kg_pronto || 0), 0) / historico.length

  const desvioLimp  = limpAtual - limpHist
  const desvioPrep  = prepAtual - prepHist
  const desvioCusto = custoHist > 0 ? ((custoAtual - custoHist) / custoHist) * 100 : 0

  const problemas = []

  if (desvioLimp > 4) problemas.push({
    icone: '✂️', gravidade: desvioLimp,
    resumo: `Perda na limpeza alta (+${desvioLimp.toFixed(0)}%)`,
    detalhe: `Perda na limpeza (${limpAtual.toFixed(0)}%) foi ${desvioLimp.toFixed(0)}% acima do histórico (${limpHist.toFixed(0)}%) — verifique o corte`,
  })

  if (desvioPrep > 4) problemas.push({
    icone: '🔥', gravidade: desvioPrep,
    resumo: `Perda no preparo alta (+${desvioPrep.toFixed(0)}%)`,
    detalhe: `Perda no preparo (${prepAtual.toFixed(0)}%) foi ${desvioPrep.toFixed(0)}% acima do histórico (${prepHist.toFixed(0)}%) — verifique temperatura e tempo`,
  })

  if (desvioCusto > 10 && desvioLimp <= 4 && desvioPrep <= 4) problemas.push({
    icone: '💰', gravidade: desvioCusto,
    resumo: `Custo elevado (+${desvioCusto.toFixed(0)}% vs média)`,
    detalhe: `Rendimento normal. Custo elevado (+${desvioCusto.toFixed(0)}% vs média) — verifique preço dos insumos`,
  })

  if (problemas.length === 0) return { ok: true, resumo: 'Dentro do padrão histórico' }

  return { ok: false, problemas: problemas.sort((a, b) => b.gravidade - a.gravidade) }
}

function BlocoMeta({ item }) {
  const diag = item.diagnostico
  return (
    <div style={{
      padding: '8px 12px', borderRadius: '8px',
      background: item.alerta.bg, border: `1px solid ${item.alerta.cor}33`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.nome}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>meta {item.meta}%</span>
          </div>
          <div style={{ height: '5px', borderRadius: '3px', background: 'var(--cor-borda)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '3px', width: `${Math.min(item.media, 100)}%`, background: item.alerta.cor }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: '72px' }}>
          <div style={{ fontWeight: 700, color: item.alerta.cor, fontSize: '1rem' }}>{item.media.toFixed(1)}%</div>
          <div style={{ fontSize: '0.68rem', color: item.alerta.cor, fontWeight: 600 }}>{item.alerta.label}</div>
        </div>
      </div>
      {/* Diagnóstico resumido */}
      {diag && (
        <div style={{ marginTop: '5px', fontSize: '0.72rem', fontWeight: 600,
          color: diag.ok ? 'var(--cor-sucesso)' : 'var(--cor-atencao)',
          paddingLeft: '2px',
        }}>
          {diag.ok
            ? `✅ ${diag.resumo}`
            : diag.problemas.map((p, i) => <div key={i}>{p.icone} {p.resumo}</div>)
          }
        </div>
      )}
      {diag === null && (
        <div style={{ marginTop: '4px', fontSize: '0.68rem', color: 'var(--cor-texto-suave)', paddingLeft: '2px' }}>
          — histórico insuficiente para diagnóstico
        </div>
      )}
    </div>
  )
}

function TooltipGrafico({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-custom">
      <div className="tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: '0.85rem' }}>
          {p.name}:{' '}
          {p.dataKey === 'Rendimento %' ? `${p.value}%` : `R$ ${p.value}`}
          {p.dataKey === 'Custo/kg R$' && p.payload?.porcao != null
            ? ` (R$ ${p.payload.porcao.toFixed(2)} a porção)` : ''}
        </div>
      ))}
    </div>
  )
}

// Faixas: 0-3% atenção, 3-7% alerta, 7%+ crítico
function nivelAlerta(rendimento, meta) {
  const desvio = meta - rendimento
  if (desvio <= 0)  return { cor: 'var(--cor-sucesso)',  label: 'Dentro da meta',  bg: 'rgba(34,197,94,0.12)' }
  if (desvio <= 3)  return { cor: 'var(--cor-atencao)',  label: `−${desvio.toFixed(1)}%`, bg: 'rgba(245,158,11,0.12)' }
  if (desvio <= 7)  return { cor: '#f97316',             label: `−${desvio.toFixed(1)}%`, bg: 'rgba(249,115,22,0.12)' }
  return             { cor: 'var(--cor-perigo)',          label: `−${desvio.toFixed(1)}%`, bg: 'rgba(239,68,68,0.15)' }
}

export default function AdminDashboard() {
  const [producoes, setProducoes]   = useState([])
  const [produtos, setProdutos]     = useState([])
  const [insumos, setInsumos]       = useState([])
  const [historicoPrecos, setHistoricoPrecos] = useState([])
  const [fornPendentes, setFornPendentes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [insumoSelecionado, setInsumoSelecionado]   = useState('')
  const [buscaInsumo, setBuscaInsumo] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const [{ data: prods }, { data: ins }, { data: precs }, { data: prod }, { data: forn }] = await Promise.all([
      supabase.from('produtos').select('id, nome, meta_rendimento, porcao_padrao_g').order('nome'),
      supabase.from('insumos').select('id, nome, preco_por_kg').order('nome'),
      supabase.from('historico_precos_insumos').select('*, insumos(nome)').order('created_at'),
      supabase.from('producoes').select('*, produtos(nome, meta_rendimento)').order('created_at', { ascending: false }).limit(150),
      supabase.from('fornecedores').select('*'),
    ])
    // Todos os produtos (para gráficos/rankings), FAB em primeiro
    const fab      = (prods || []).filter(p => p.nome.toUpperCase().includes('FAB'))
    const outros   = (prods || []).filter(p => !p.nome.toUpperCase().includes('FAB'))
    setProdutos([...fab, ...outros])
    setInsumos(ins || [])
    setHistoricoPrecos(precs || [])
    setProducoes(prod || [])
    setFornPendentes((forn || []).filter(f => f.aprovado === false))
    // Seletor de detalhe começa no primeiro FAB
    if (fab.length) setProdutoSelecionado(fab[0].id)
    else if (prods?.length) setProdutoSelecionado(prods[0].id)
    if (ins?.length) setInsumoSelecionado(ins[0].id)
    setCarregando(false)
  }

  async function aprovarFornecedor(id) {
    await supabase.from('fornecedores').update({ aprovado: true }).eq('id', id)
    setFornPendentes(prev => prev.filter(f => f.id !== id))
  }

  async function rejeitarFornecedor(id) {
    if (!window.confirm('Rejeitar e excluir este fornecedor?')) return
    await supabase.from('fornecedores').delete().eq('id', id)
    setFornPendentes(prev => prev.filter(f => f.id !== id))
  }

  if (carregando) return <div className="loading-tela">Carregando dashboard...</div>

  // ─── BLOCO GLOBAL: produções do mês atual ───
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const producoesMes = producoes.filter(p => new Date(p.created_at) >= inicioMes)
  const nomeMes = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Contagem por produto no mês
  const contagemPorProduto = produtos.map(prod => ({
    id: prod.id,
    nome: prod.nome,
    qtd: producoesMes.filter(p => p.produto_id === prod.id).length,
  })).filter(p => p.qtd > 0).sort((a, b) => b.qtd - a.qtd)

  const maisProduzido  = contagemPorProduto[0] || null
  const menosProduzido = contagemPorProduto[contagemPorProduto.length - 1] || null

  // Ranking de meta: média de rendimento por produto (últimas 10 produções de cada)
  const rankingMeta = produtos.map(prod => {
    const recentes = producoes.filter(p => p.produto_id === prod.id).slice(0, 10)
    if (!recentes.length) return null
    const mediaRend = recentes.reduce((a, p) => a + (p.rendimento || 0), 0) / recentes.length
    const alerta = nivelAlerta(mediaRend, prod.meta_rendimento)
    const diagnostico = diagnosticar(recentes)
    return { id: prod.id, nome: prod.nome, media: mediaRend, meta: prod.meta_rendimento, qtd: recentes.length, alerta, diagnostico }
  }).filter(Boolean).sort((a, b) => {
    // Ordena: dentro da meta primeiro (desc rendimento), depois fora (asc rendimento)
    const aFora = a.media < a.meta
    const bFora = b.media < b.meta
    if (aFora !== bFora) return aFora ? 1 : -1
    return b.media - a.media
  })

  // ─── VARIAÇÃO DE PREÇOS ───
  // Para cada insumo, pega o histórico e calcula a variação mais recente
  const variacaoPrecos = insumos.map(ins => {
    const hist = historicoPrecos.filter(h => h.insumo_id === ins.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (!hist.length) return null
    const ultimo = hist[0]
    const variacao = ((parseFloat(ultimo.preco_novo) - parseFloat(ultimo.preco_anterior)) / parseFloat(ultimo.preco_anterior)) * 100
    return { nome: ins.nome, variacao, anterior: ultimo.preco_anterior, novo: ultimo.preco_novo, data: ultimo.created_at }
  }).filter(Boolean).sort((a, b) => Math.abs(b.variacao) - Math.abs(a.variacao))

  const maioresAltas   = variacaoPrecos.filter(v => v.variacao > 0).slice(0, 3)
  const maioresBaixas  = variacaoPrecos.filter(v => v.variacao < 0).slice(0, 3)

  // ─── KPIs do produto selecionado ───
  const metaDoProduto = produtos.find(p => p.id === produtoSelecionado)?.meta_rendimento || 70
  const nomeProdutoSelecionado = produtos.find(p => p.id === produtoSelecionado)?.nome || '—'
  const producoesDoProduto = producoes.filter(p => p.produto_id === produtoSelecionado)
  const totalDoProduto = producoesDoProduto.length
  const dentroMeta = producoesDoProduto.filter(p => (p.rendimento || 0) >= metaDoProduto).length
  const foraMeta   = producoesDoProduto.filter(p => (p.rendimento || 0) < metaDoProduto).length
  const pctDentro  = totalDoProduto ? Math.round((dentroMeta / totalDoProduto) * 100) : 0

  const ultimas5 = producoesDoProduto.slice(0, 5)
  const ultimas10 = producoesDoProduto.slice(0, 10)
  const custoMedioKg = ultimas5.length
    ? ultimas5.reduce((a, p) => a + (p.custo_por_kg_pronto || 0), 0) / ultimas5.length
    : null

  // Sparklines e tendências
  const sparkRendimento = [...producoesDoProduto].reverse().slice(-8).map(p => p.rendimento || 0)
  const sparkCusto = [...producoesDoProduto].reverse().slice(-8).map(p => p.custo_porcao || 0)
  const tendRendimento = producoesDoProduto.length >= 2
    ? ((producoesDoProduto[0].rendimento || 0) - (producoesDoProduto[1].rendimento || 0))
    : null
  const tendCusto = producoesDoProduto.length >= 2
    ? (((producoesDoProduto[0].custo_porcao || 0) - (producoesDoProduto[1].custo_porcao || 0)) / (producoesDoProduto[1].custo_porcao || 1)) * 100
    : null

  const diagDetalhe = diagnosticar(producoesDoProduto)

  // ─── Alertas contínuos (>50% fora da meta nos últimos 30 dias) ───
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const alertasContinuos = produtos.map(prod => {
    const recentes = producoes.filter(p => p.produto_id === prod.id && new Date(p.created_at) >= trintaDiasAtras)
    if (recentes.length < 2) return null
    const foraCount = recentes.filter(p => (p.rendimento || 0) < prod.meta_rendimento).length
    if (foraCount / recentes.length > 0.5) return { nome: prod.nome, foraCount, total: recentes.length }
    return null
  }).filter(Boolean)

  // ─── Gráfico 1 ───
  const producoesProduto = producoesDoProduto.slice(0, 20).reverse().map(p => ({
    data: new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    'Custo/kg R$':  parseFloat((p.custo_por_kg_pronto || 0).toFixed(2)),
    'Rendimento %': parseFloat((p.rendimento || 0).toFixed(1)),
    porcao: parseFloat((p.custo_porcao || 0).toFixed(2)),
  }))

  // ─── Gráfico 2 ───
  const rendPorProduto = produtos.map(prod => {
    const prods = producoes.filter(p => p.produto_id === prod.id)
    const media = prods.length ? prods.reduce((a, p) => a + (p.rendimento || 0), 0) / prods.length : 0
    return { nome: prod.nome, rendimento: parseFloat(media.toFixed(1)), meta: prod.meta_rendimento, qtd: prods.length }
  }).filter(p => p.qtd > 0).sort((a, b) => b.rendimento - a.rendimento)

  // ─── Gráfico 3 ───
  const precoInsumoAtual = insumos.find(i => i.id === insumoSelecionado)
  const historicoInsumo = historicoPrecos
    .filter(h => h.insumo_id === insumoSelecionado)
    .map(h => ({ data: new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 'Preço R$/kg': parseFloat((h.preco_novo || 0).toFixed(2)) }))
  if (precoInsumoAtual) {
    historicoInsumo.push({ data: 'Atual', 'Preço R$/kg': parseFloat(precoInsumoAtual.preco_por_kg.toFixed(2)) })
  }

  return (
    <div>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Dashboard</h1>
          <p className="pagina-subtitulo">Visão gerencial do controle de custos</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BLOCO 1 — PANORAMA GERAL DO MÊS
      ══════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div className="card-titulo" style={{ margin: 0 }}>Panorama geral</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>
              {nomeMes}: <strong>{producoesMes.length} produção(ões)</strong> &nbsp;·&nbsp; ranking baseado nas últimas 10 produções de cada item
            </div>
          </div>
        </div>

        {/* Mais/menos produzido */}
        {contagemPorProduto.length > 0 && (
          <div className="grid-2col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {maisProduzido && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px 16px', flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Mais produzido</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{maisProduzido.nome}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--cor-sucesso)' }}>{maisProduzido.qtd}× no mês</div>
              </div>
            )}
            {menosProduzido && maisProduzido?.id !== menosProduzido?.id && (
              <div style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid var(--cor-borda)', borderRadius: '10px', padding: '10px 16px', flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Menos produzido</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{menosProduzido.nome}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>{menosProduzido.qtd}× no mês</div>
              </div>
            )}
            {contagemPorProduto.length === 0 && (
              <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Nenhuma produção registrada este mês.</div>
            )}
          </div>
        )}

        {/* Top 3 melhores + Top 3 piores — baseado nas últimas 10 produções de cada produto */}
        {rankingMeta.length > 0 ? (() => {
          const dentroMetas = rankingMeta.filter(i => i.media >= i.meta).slice(0, 3)
          const foraMetas   = rankingMeta.filter(i => i.media < i.meta).sort((a, b) => (a.media - a.meta) - (b.media - b.meta)).slice(0, 3)
          return (
            <div className="panorama-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cor-sucesso)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  🏅 Dentro da meta
                </div>
                {dentroMetas.length > 0
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{dentroMetas.map(item => <BlocoMeta key={item.id} item={item} />)}</div>
                  : <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem', padding: '8px 0' }}>Nenhum produto dentro da meta ainda.</div>
                }
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cor-perigo)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  ⚠️ Precisam de atenção
                </div>
                {foraMetas.length > 0
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{foraMetas.map(item => <BlocoMeta key={item.id} item={item} />)}</div>
                  : <div style={{ color: 'var(--cor-sucesso)', fontSize: '0.85rem', padding: '8px 0' }}>✅ Todos os produtos estão dentro da meta.</div>
                }
              </div>
            </div>
          )
        })() : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--cor-texto-suave)' }}>
            Nenhuma produção registrada ainda.
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>
          <span>🟢 Dentro da meta</span>
          <span style={{ color: 'var(--cor-atencao)' }}>🟡 até −3%</span>
          <span style={{ color: '#f97316' }}>🟠 −3 a −7%</span>
          <span style={{ color: 'var(--cor-perigo)' }}>🔴 −7%+</span>
        </div>
      </div>

      {/* variação de preços — aparece abaixo do panorama, só se tiver histórico */}

      {/* ══════════════════════════════════════════
          KPIs FILTRADOS POR PRODUTO
      ══════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--cor-texto-suave)' }}>
          Detalhe por produto
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)', fontWeight: 600 }}>Produto:</span>
          <select value={produtoSelecionado} onChange={e => setProdutoSelecionado(e.target.value)} className="select-padrao">
            {produtos
              .filter(p => p.nome.toUpperCase().includes('FAB'))
              .map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome.replace(/ ?- ?FAB/i, '')}
                </option>
              ))
            }
          </select>
        </div>
      </div>

      <div className="grid-metricas" style={{ marginBottom: '20px' }}>
        <MetricCard titulo="Produções registradas" valor={totalDoProduto} subtexto={nomeProdutoSelecionado} cor="var(--cor-info)" />
        <MetricCard titulo="Custo médio/porção" valor={producoesDoProduto[0] ? `R$ ${parseFloat(producoesDoProduto[0].custo_porcao || 0).toFixed(2)}` : '—'} subtexto={`últimas ${ultimas5.length} produções`} cor="#a855f7" sparkline={sparkCusto} tendencia={tendCusto} />
        <MetricCard titulo="Rendimento último" valor={producoesDoProduto[0] ? `${parseFloat(producoesDoProduto[0].rendimento || 0).toFixed(1)}%` : '—'} subtexto={`meta: ${metaDoProduto}%`} cor="var(--cor-sucesso)" sparkline={sparkRendimento} tendencia={tendRendimento} />
        <MetricCard titulo="Dentro da meta" valor={`${dentroMeta}/${totalDoProduto}`} subtexto={`${pctDentro}% das produções`} cor={pctDentro >= 70 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)'} />
      </div>

      {/* ── Diagnóstico detalhado do produto selecionado ── */}
      {diagDetalhe !== null && (
        <div className={`alerta-box ${diagDetalhe.ok ? 'alerta-box-sucesso' : 'alerta-box-atencao'}`} style={{ marginBottom: '20px' }}>
          <div className="alerta-titulo" style={{ color: diagDetalhe.ok ? 'var(--cor-sucesso)' : 'var(--cor-primaria)', marginBottom: diagDetalhe.ok ? 0 : '10px' }}>
            {diagDetalhe.ok ? '✅' : '🔎'} Diagnóstico — {nomeProdutoSelecionado}
            <span style={{ fontWeight: 400, fontSize: '0.75rem', marginLeft: '8px', color: 'var(--cor-texto-suave)' }}>baseado na última produção vs histórico</span>
          </div>
          {diagDetalhe.ok ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--cor-sucesso)' }}>Última produção dentro do padrão histórico. Nenhum desvio significativo identificado.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {diagDetalhe.problemas.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--cor-fundo)', borderRadius: '8px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{p.icone}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--cor-texto)', marginBottom: '2px' }}>{p.resumo}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>{p.detalhe}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {diagDetalhe === null && producoesDoProduto.length > 0 && producoesDoProduto.length < 3 && (
        <div style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
          🔎 <strong>Diagnóstico indisponível</strong> — são necessárias pelo menos 3 produções para comparação histórica. ({producoesDoProduto.length} registrada{producoesDoProduto.length > 1 ? 's' : ''})
        </div>
      )}

      {/* Fornecedores pendentes */}
      {fornPendentes.length > 0 && (
        <div className="alerta-box alerta-box-info" style={{ marginBottom: '20px' }}>
          <div className="alerta-titulo" style={{ color: 'var(--cor-info)' }}>
            🏭 {fornPendentes.length} fornecedor(es) aguardando aprovação
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fornPendentes.map(f => (
              <div key={f.id} className="alerta-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{f.nome}</div>
                  {f.contato && <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>{f.contato}</div>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => aprovarFornecedor(f.id)} className="badge-sucesso" style={{ border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✓ Aprovar</button>
                  <button onClick={() => rejeitarFornecedor(f.id)} className="badge-perigo" style={{ border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✕ Rejeitar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico 1 */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div className="card-titulo">Evolução de custos e rendimento — {nomeProdutoSelecionado}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>
            últimas 20 produções — 🟣 Custo/kg (hover mostra valor da porção) &nbsp;|&nbsp; 🔵 Rendimento
          </div>
        </div>
        {producoesProduto.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cor-texto-suave)' }}>Nenhuma produção para este produto.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={producoesProduto} margin={{ top: 12, right: 24, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="var(--cor-borda)" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="custo" tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} tickFormatter={v => `R$${v}`} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rend" orientation="right" tick={{ fontSize: 11, fill: '#3b82f6' }} domain={[0, 100]} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipGrafico />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '12px' }} />
              <Line yAxisId="custo" type="monotone" dataKey="Custo/kg R$"  stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              <Line yAxisId="rend"  type="monotone" dataKey="Rendimento %" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid-2col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Gráfico 2: rendimento médio por produto */}
        <div className="card">
          <div className="card-titulo" style={{ marginBottom: '16px' }}>Rendimento médio por produto</div>
          {rendPorProduto.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--cor-texto-suave)' }}>Nenhuma produção.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rendPorProduto} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--cor-borda)" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} width={90} />
                <Tooltip contentStyle={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px', color: 'var(--cor-texto)' }} formatter={v => `${v}%`} />
                <Bar dataKey="rendimento" radius={[0, 4, 4, 0]}>
                  {rendPorProduto.map((entry, i) => <Cell key={i} fill={entry.rendimento >= entry.meta ? '#22c55e' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '8px' }}>🟢 Acima da meta &nbsp; 🔴 Abaixo da meta</div>
        </div>

        {/* Gráfico 3: evolução do preço do insumo */}
        <div className="card">
          <div className="card-titulo" style={{ marginBottom: '12px' }}>Preços dos insumos</div>

          {/* Altas e baixas recentes */}
          {(maioresAltas.length > 0 || maioresBaixas.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cor-perigo)', marginBottom: '6px' }}>📈 Maiores altas</div>
                {maioresAltas.length === 0
                  ? <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>Nenhuma</div>
                  : maioresAltas.map((v, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '2px 0' }}>
                      <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.nome}</span>
                      <span style={{ fontWeight: 700, color: 'var(--cor-perigo)', marginLeft: '8px', flexShrink: 0 }}>+{v.variacao.toFixed(1)}%</span>
                    </div>
                  ))
                }
              </div>
              <div style={{ background: 'rgba(34,197,94,0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cor-sucesso)', marginBottom: '6px' }}>📉 Maiores baixas</div>
                {maioresBaixas.length === 0
                  ? <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>Nenhuma</div>
                  : maioresBaixas.map((v, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '2px 0' }}>
                      <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.nome}</span>
                      <span style={{ fontWeight: 700, color: 'var(--cor-sucesso)', marginLeft: '8px', flexShrink: 0 }}>{v.variacao.toFixed(1)}%</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Seletor com busca */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
            <input
              placeholder="Buscar insumo..."
              value={buscaInsumo}
              onChange={e => {
                setBuscaInsumo(e.target.value)
                const match = insumos.find(i => i.nome.toLowerCase().includes(e.target.value.toLowerCase()))
                if (match) setInsumoSelecionado(match.id)
              }}
              style={{ width: '100%', paddingLeft: '32px', padding: '8px 12px 8px 32px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'inherit', background: 'var(--cor-fundo-card)', color: 'var(--cor-texto)', boxSizing: 'border-box' }}
            />
          </div>
          <select value={insumoSelecionado} onChange={e => { setInsumoSelecionado(e.target.value); setBuscaInsumo('') }} className="select-padrao" style={{ width: '100%', marginBottom: '12px', fontSize: '0.85rem' }}>
            {insumos
              .filter(i => !buscaInsumo || i.nome.toLowerCase().includes(buscaInsumo.toLowerCase()))
              .map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>

          {historicoInsumo.length <= 1 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>📊</div>
              Preço atual: <strong>R$ {precoInsumoAtual ? parseFloat(precoInsumoAtual.preco_por_kg).toFixed(2) : '—'}/kg</strong>
              <div style={{ marginTop: '6px', fontSize: '0.8rem' }}>Edite o preço nos Cadastros para o histórico aparecer aqui.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={historicoInsumo} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--cor-texto-suave)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--cor-texto-suave)' }} tickFormatter={v => `R$${v}`} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px', color: 'var(--cor-texto)' }} formatter={v => [`R$ ${v}/kg`, 'Preço']} />
                <Line type="monotone" dataKey="Preço R$/kg" stroke="#a855f7" strokeWidth={3} dot={{ r: 5, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ranking */}
      <div className="card">
        <div className="card-titulo" style={{ marginBottom: '16px' }}>🏆 Ranking — melhores rendimentos</div>
        <div className="tabela-container">
          <table>
            <thead>
              <tr><th>#</th><th>Produto</th><th className="col-esconder-mobile">Data</th><th>Rendimento</th><th className="col-esconder-mobile">Custo/porção</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[...producoes].sort((a, b) => (b.rendimento || 0) - (a.rendimento || 0)).slice(0, 8).map((p, i) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--cor-primaria)' : 'var(--cor-texto-suave)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td>{p.produtos?.nome}</td>
                  <td className="col-esconder-mobile" style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--cor-sucesso)' }}>{parseFloat(p.rendimento || 0).toFixed(1)}%</td>
                  <td className="col-esconder-mobile">R$ {parseFloat(p.custo_porcao || 0).toFixed(2)}</td>
                  <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                </tr>
              ))}
              {producoes.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--cor-texto-suave)', padding: '32px' }}>Nenhuma produção registrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
