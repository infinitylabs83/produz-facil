/**
 * KitchenGateway — acesso via QR Code + PIN
 * Rota pública: /cozinha?t=TOKEN
 * Fluxo: PIN → selecionar funcionário → registrar produção → resultado
 */
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'pf_kitchen'

// ── cálculos ──────────────────────────────────────────────────────────────────
function calcular({ pesoCruKg, pesoAposLimpezaKg, pesoProntoKg, ingredientes, porcaoPadraoG, metaRendimento }) {
  const perdaLimpeza    = pesoCruKg - pesoAposLimpezaKg
  const perdaPreparo    = pesoAposLimpezaKg - pesoProntoKg
  const perdaTotal      = pesoCruKg - pesoProntoKg
  const percentualPerda = pesoCruKg > 0 ? (perdaTotal / pesoCruKg) * 100 : 0
  const rendimento      = pesoCruKg > 0 ? (pesoProntoKg / pesoCruKg) * 100 : 0
  const custoIngredientes = ingredientes.reduce((acc, i) => {
    const qtdKg = i.unidade === 'g' ? i.quantidade / 1000 : i.quantidade
    return acc + qtdKg * (i.preco_por_kg || 0)
  }, 0)
  const custoPorKgPronto = pesoProntoKg > 0 ? custoIngredientes / pesoProntoKg : 0
  const custoPorcao      = (custoPorKgPronto / 1000) * (porcaoPadraoG || 100)
  let status = 'atencao'
  if (rendimento >= metaRendimento * 1.02) status = 'excelente'
  else if (rendimento >= metaRendimento * 0.97) status = 'meta'
  else if (rendimento < metaRendimento * 0.85) status = 'perda'
  return { perdaLimpeza, perdaPreparo, perdaTotal, percentualPerda, rendimento, custoTotal: custoIngredientes, custoPorKgPronto, custoPorcao, status }
}

const STATUS_CONFIG = {
  excelente: { emoji: '🏆', label: 'Rendimento excelente!', cor: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  meta:      { emoji: '✅', label: 'Dentro da meta!',        cor: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  atencao:   { emoji: '⚠️', label: 'Abaixo da meta',         cor: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  perda:     { emoji: '❌', label: 'Perda alta!',             cor: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

// ── estilos base ──────────────────────────────────────────────────────────────
const S = {
  page:   { minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  card:   { background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '32px 28px' },
  input:  { width: '100%', padding: '16px', border: '2px solid #334155', borderRadius: '12px', background: '#0f172a', color: '#f1f5f9', fontSize: '1.1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn:    { width: '100%', padding: '18px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { width: '100%', padding: '14px', border: '2px solid #334155', borderRadius: '12px', background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' },
}

// ── Tela PIN ──────────────────────────────────────────────────────────────────
function TelaPIN({ token, onSucesso }) {
  const [pin, setPin]     = useState('')
  const [erro, setErro]   = useState('')
  const [loading, setLoading] = useState(false)

  async function validar(e) {
    e.preventDefault()
    if (pin.length < 4) { setErro('PIN deve ter 4 dígitos.'); return }
    setLoading(true)
    setErro('')

    // 1. Valida token + PIN e obtém dados da empresa
    const { data: empData, error: empErr } = await supabase
      .rpc('validar_acesso_cozinha', { p_token: token, p_pin: pin })

    if (empErr || !empData) {
      setErro('PIN incorreto. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Faz login como usuário da cozinha
    const kitchenEmail = `kitchen_${empData.empresa_id.replace(/-/g, '')}@pf.internal`
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: kitchenEmail,
      password: pin,
    })

    if (loginErr) {
      setErro('Erro de acesso. Fale com o administrador.')
      setLoading(false)
      return
    }

    // 3. Salva sessão local
    const sessao = {
      token,
      empresa_id: empData.empresa_id,
      nome_empresa: empData.nome_empresa,
      funcionarios: empData.funcionarios || [],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao))
    onSucesso(sessao)
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔑</div>
          <div style={{ color: '#f97316', fontWeight: 800, fontSize: '1.3rem' }}>ProduzFácil</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>Acesso da Cozinha</div>
        </div>

        {erro && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '16px', textAlign: 'center' }}>
            {erro}
          </div>
        )}

        <form onSubmit={validar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>Digite o PIN</label>
            <input
              style={{ ...S.input, fontSize: '2rem', textAlign: 'center', letterSpacing: '0.5rem' }}
              type="password" inputMode="numeric" maxLength={6} placeholder="••••"
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
              onFocus={e => e.target.style.borderColor = '#f97316'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
          </div>
          <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? '⏳ Verificando...' : '🚀 Entrar na Cozinha'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Tela selecionar funcionário ───────────────────────────────────────────────
function TelaFuncionario({ sessao, onSelecionar }) {
  const lista = sessao.funcionarios || []

  return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ color: '#f97316', fontWeight: 800, fontSize: '1.1rem' }}>{sessao.nome_empresa}</div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.4rem', marginTop: '8px' }}>Quem está produzindo?</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>Toque no seu nome</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {lista.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '20px', fontSize: '0.9rem' }}>
              Nenhum funcionário cadastrado. Peça ao administrador para cadastrar no painel.
            </div>
          ) : (
            lista.map((nome, i) => (
              <button key={i} onClick={() => onSelecionar(nome)} style={{
                padding: '20px', border: '2px solid #334155', borderRadius: '14px',
                background: '#0f172a', color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
              >
                <span style={{ width: '44px', height: '44px', background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, flexShrink: 0 }}>
                  {nome.charAt(0).toUpperCase()}
                </span>
                {nome}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Produção (wizard simplificado para cozinha) ───────────────────────────────
function TelaProducao({ sessao, funcionario, onVoltar, onConcluido }) {
  const [etapa, setEtapa]         = useState(0) // 0=produto 1=pesos 2=ingredientes
  const [produtos, setProdutos]   = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [produtoId, setProdutoId] = useState('')
  const [fornecedorId, setFornecedorId] = useState('')
  const [pesoCru, setPesoCru]     = useState('')
  const [pesoLimpeza, setPesoLimpeza] = useState('')
  const [pesoPronto, setPesoPronto]   = useState('')
  const [ingredientes, setIngredientes] = useState([])
  const [produtoSel, setProdutoSel]    = useState(null)
  const [salvando, setSalvando]        = useState(false)
  const [erro, setErro]                = useState('')
  const ETAPAS = ['Produto', 'Pesagem', 'Ingredientes']

  useEffect(() => {
    async function carregar() {
      const { data: p } = await supabase.from('produtos').select('*').eq('empresa_id', sessao.empresa_id).eq('ativo', true).order('nome')
      const { data: f } = await supabase.from('fornecedores').select('*').eq('empresa_id', sessao.empresa_id).order('nome')
      setProdutos(p || [])
      setFornecedores(f || [])
    }
    carregar()
  }, [sessao.empresa_id])

  async function selecionarProduto(pid) {
    setProdutoId(pid)
    const prod = produtos.find(p => p.id === pid)
    setProdutoSel(prod)
    const { data: ing } = await supabase
      .from('produto_ingredientes')
      .select('*, insumos(nome, preco_por_kg)')
      .eq('produto_id', pid)
    setIngredientes((ing || []).map(i => ({
      id: i.id, insumo_id: i.insumo_id,
      nome: i.insumos?.nome || '', preco_por_kg: i.insumos?.preco_por_kg || 0,
      quantidade: '', unidade: i.unidade_uso || 'kg',
    })))
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    const cru = parseFloat(pesoCru) || 0
    const lim = parseFloat(pesoLimpeza) || 0
    const pron = parseFloat(pesoPronto) || 0
    const calc = calcular({
      pesoCruKg: cru, pesoAposLimpezaKg: lim, pesoProntoKg: pron,
      ingredientes: ingredientes.map(i => ({ ...i, quantidade: parseFloat(i.quantidade) || 0 })),
      porcaoPadraoG: produtoSel?.porcao_padrao_g || 100,
      metaRendimento: produtoSel?.meta_rendimento || 70,
    })

    const { data: prod, error: errProd } = await supabase.from('producoes').insert({
      empresa_id: sessao.empresa_id,
      produto_id: produtoId,
      fornecedor_id: fornecedorId || null,
      operador_nome: funcionario,
      peso_cru_kg: cru, peso_apos_limpeza_kg: lim, peso_pronto_kg: pron,
      perda_limpeza_kg: calc.perdaLimpeza, perda_preparo_kg: calc.perdaPreparo,
      perda_total_kg: calc.perdaTotal, percentual_perda: calc.percentualPerda,
      rendimento: calc.rendimento, custo_total: calc.custoTotal,
      custo_por_kg_pronto: calc.custoPorKgPronto, custo_porcao: calc.custoPorcao,
      status: calc.status,
    }).select().single()

    if (errProd) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }

    const ingsValidos = ingredientes.filter(i => parseFloat(i.quantidade) > 0)
    if (ingsValidos.length > 0) {
      await supabase.from('producao_ingredientes').insert(
        ingsValidos.map(i => ({
          producao_id: prod.id, insumo_id: i.insumo_id,
          nome_livre: i.nome, quantidade: parseFloat(i.quantidade),
          unidade: i.unidade, custo_unitario: i.preco_por_kg,
        }))
      )
    }
    setSalvando(false)
    onConcluido({ ...prod, ...calc, produto_nome: produtoSel?.nome })
  }

  const inputNum = (val, set) => (
    <input
      type="number" inputMode="decimal" value={val}
      onChange={e => set(e.target.value)}
      style={{ ...S.input, fontSize: '1.3rem', textAlign: 'center' }}
      onFocus={e => e.target.style.borderColor = '#f97316'}
      onBlur={e => e.target.style.borderColor = '#334155'}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#f1f5f9', padding: '16px', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
        <div>
          <div style={{ color: '#f97316', fontWeight: 800, fontSize: '1rem' }}>{sessao.nome_empresa}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>👤 {funcionario}</div>
        </div>
        <button onClick={onVoltar} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '8px', padding: '8px 14px', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' }}>
          Trocar
        </button>
      </div>

      {/* Steps visuais */}
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: '500px', margin: '0 auto 28px' }}>
        {ETAPAS.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < ETAPAS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: i < etapa ? '#f97316' : i === etapa ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#1e293b',
                border: i === etapa ? '2px solid #f97316' : i < etapa ? 'none' : '2px solid #334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: i < etapa ? '1rem' : '0.9rem',
                color: i <= etapa ? 'white' : '#475569',
                boxShadow: i === etapa ? '0 0 14px rgba(249,115,22,0.5)' : 'none',
                transition: 'all 0.3s ease', flexShrink: 0,
              }}>
                {i < etapa ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', color: i === etapa ? '#f97316' : i < etapa ? '#22c55e' : '#475569', fontWeight: i === etapa ? 700 : 500, whiteSpace: 'nowrap' }}>{e}</span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: i < etapa ? '#f97316' : '#334155', margin: '0 6px', marginBottom: '18px', transition: 'background 0.3s ease' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        {erro && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#fca5a5', marginBottom: '16px', textAlign: 'center' }}>{erro}</div>}

        {/* ETAPA 0 — PRODUTO */}
        {etapa === 0 && (
          <div style={{ ...S.card, padding: '24px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '20px' }}>🍳 O que você está produzindo?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {produtos.map(p => (
                <button key={p.id} onClick={() => selecionarProduto(p.id)} style={{
                  padding: '18px 20px', border: `2px solid ${produtoId === p.id ? '#f97316' : '#334155'}`,
                  borderRadius: '12px', background: produtoId === p.id ? 'rgba(249,115,22,0.1)' : '#0f172a',
                  color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                }}>
                  {p.nome}
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 400 }}>
                    Meta: {p.meta_rendimento}% · Porção: {p.porcao_padrao_g}g
                  </div>
                </button>
              ))}
            </div>

            {produtos.length > 0 && fornecedores.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Fornecedor (opcional)</label>
                <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}
                  style={{ ...S.input, fontSize: '1rem' }}>
                  <option value="">Selecione o fornecedor...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            )}

            <button disabled={!produtoId} onClick={() => setEtapa(1)} style={{ ...S.btn, opacity: produtoId ? 1 : 0.4 }}>
              Próximo →
            </button>
          </div>
        )}

        {/* ETAPA 1 — PESAGEM */}
        {etapa === 1 && (
          <div style={{ ...S.card, padding: '24px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>⚖️ Pesagem</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '24px' }}>{produtoSel?.nome}</div>

            {[
              { label: '🥩 Peso cru (kg)', val: pesoCru, set: setPesoCru, desc: 'Antes de limpar' },
              { label: '🔪 Após limpeza (kg)', val: pesoLimpeza, set: setPesoLimpeza, desc: 'Depois de limpar e aparar' },
              { label: '✅ Peso final pronto (kg)', val: pesoPronto, set: setPesoPronto, desc: 'Pronto para servir' },
            ].map((c, i) => (
              <div key={i} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{c.label}</label>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>{c.desc}</div>
                {inputNum(c.val, c.set)}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setEtapa(0)} style={S.btnSec}>← Voltar</button>
              <button disabled={!pesoCru || !pesoLimpeza || !pesoPronto} onClick={() => setEtapa(2)}
                style={{ ...S.btn, opacity: pesoCru && pesoLimpeza && pesoPronto ? 1 : 0.4, flex: 2 }}>
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 2 — INGREDIENTES */}
        {etapa === 2 && (
          <div style={{ ...S.card, padding: '24px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>🧂 Ingredientes usados</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>Informe as quantidades utilizadas</div>

            {ingredientes.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px', fontSize: '0.9rem' }}>
                Nenhum ingrediente cadastrado para este produto.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                {ingredientes.map((ing, i) => (
                  <div key={i}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>
                      {ing.nome}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number" inputMode="decimal" placeholder="0"
                        value={ing.quantidade}
                        onChange={e => {
                          const novo = [...ingredientes]
                          novo[i] = { ...novo[i], quantidade: e.target.value }
                          setIngredientes(novo)
                        }}
                        style={{ ...S.input, flex: 1, fontSize: '1.2rem', textAlign: 'center' }}
                        onFocus={e => e.target.style.borderColor = '#f97316'}
                        onBlur={e => e.target.style.borderColor = '#334155'}
                      />
                      <select value={ing.unidade}
                        onChange={e => {
                          const novo = [...ingredientes]
                          novo[i] = { ...novo[i], unidade: e.target.value }
                          setIngredientes(novo)
                        }}
                        style={{ ...S.input, width: '80px', fontSize: '1rem', textAlign: 'center', padding: '16px 8px' }}>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapa(1)} style={S.btnSec}>← Voltar</button>
              <button onClick={salvar} disabled={salvando} style={{ ...S.btn, flex: 2, opacity: salvando ? 0.7 : 1 }}>
                {salvando ? '⏳ Salvando...' : '💾 Salvar Produção'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tela resultado ─────────────────────────────────────────────────────────────
function Confetti() {
  const cores = ['#f97316','#22c55e','#3b82f6','#fbbf24','#a855f7','#ef4444']
  const particulas = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 1.2 + Math.random() * 0.8,
    cor: cores[i % cores.length],
    size: 6 + Math.random() * 6,
    rot: Math.random() * 360,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '20px' }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(280px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particulas.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 0, left: `${p.x}%`,
          width: `${p.size}px`, height: `${p.size}px`,
          background: p.cor, borderRadius: p.id % 3 === 0 ? '50%' : '2px',
          animation: `confettiFall ${p.dur}s ease-in ${p.delay}s forwards`,
          transform: `rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  )
}

function TelaResultado({ resultado, funcionario, onNova }) {
  const s = STATUS_CONFIG[resultado.status] || STATUS_CONFIG.atencao
  const sucesso = resultado.status === 'excelente' || resultado.status === 'meta'
  return (
    <div style={S.page}>
      <div style={{ ...S.card, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {sucesso && <Confetti />}
        <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{s.emoji}</div>
        <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.cor, marginBottom: '8px' }}>{s.label}</div>
        <div style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.9rem' }}>
          {resultado.produto_nome} · por {funcionario}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Rendimento', val: `${Number(resultado.rendimento).toFixed(1)}%`, cor: s.cor },
            { label: 'Perda total', val: `${Number(resultado.percentualPerda).toFixed(1)}%`, cor: '#94a3b8' },
            { label: 'Custo total', val: `R$ ${Number(resultado.custoTotal).toFixed(2)}`, cor: '#94a3b8' },
            { label: 'Custo/porção', val: `R$ ${Number(resultado.custoPorcao).toFixed(2)}`, cor: '#f97316' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#0f172a', borderRadius: '10px', padding: '14px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: m.cor }}>{m.val}</div>
            </div>
          ))}
        </div>

        <button onClick={onNova} style={S.btn}>🍳 Nova Produção</button>
      </div>
    </div>
  )
}

// ── Tela acesso inválido ───────────────────────────────────────────────────────
function TelaInvalido() {
  return (
    <div style={S.page}>
      <div style={{ ...S.card, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❌</div>
        <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px' }}>QR Code inválido</div>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Este QR Code não é válido ou foi revogado.<br />
          Peça ao administrador para gerar um novo.
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function KitchenGateway() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')

  const [fase, setFase]           = useState('verificando') // verificando|pin|funcionario|producao|resultado
  const [sessao, setSessao]       = useState(null)
  const [funcionario, setFuncionario] = useState('')
  const [resultado, setResultado] = useState(null)

  const verificarSessao = useCallback(async () => {
    if (!token) { setFase('invalido'); return }

    // Verifica sessão salva
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (salvo) {
      try {
        const dados = JSON.parse(salvo)
        if (dados.token === token) {
          // Verifica se o token ainda é válido
          const { data, error } = await supabase.rpc('validar_acesso_cozinha', {
            p_token: dados.token, p_pin: dados.pin_salvo || ''
          })
          if (!error && data) {
            setSessao({ ...dados, funcionarios: data.funcionarios || dados.funcionarios })
            setFase('funcionario')
            return
          }
        }
      } catch {}
      localStorage.removeItem(STORAGE_KEY)
    }

    // Verifica se token existe (sem PIN)
    const { data, error } = await supabase
      .from('empresas')
      .select('id')
      .eq('token_cozinha', token)
      .single()

    if (error || !data) { setFase('invalido'); return }
    setFase('pin')
  }, [token])

  useEffect(() => { verificarSessao() }, [verificarSessao])

  if (fase === 'verificando') return (
    <div style={S.page}>
      <div style={{ color: '#64748b', fontSize: '1rem' }}>⏳ Verificando acesso...</div>
    </div>
  )

  if (fase === 'invalido') return <TelaInvalido />

  if (fase === 'pin') return (
    <TelaPIN token={token} onSucesso={s => { setSessao(s); setFase('funcionario') }} />
  )

  if (fase === 'funcionario') return (
    <TelaFuncionario sessao={sessao} onSelecionar={nome => { setFuncionario(nome); setFase('producao') }} />
  )

  if (fase === 'producao') return (
    <TelaProducao
      sessao={sessao}
      funcionario={funcionario}
      onVoltar={() => setFase('funcionario')}
      onConcluido={res => { setResultado(res); setFase('resultado') }}
    />
  )

  if (fase === 'resultado') return (
    <TelaResultado
      resultado={resultado}
      funcionario={funcionario}
      onNova={() => setFase('funcionario')}
    />
  )
}
