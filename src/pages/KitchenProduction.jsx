import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Emojis por categoria de produto
const EMOJI_PRODUTO = {
  'Carnes': '🥩', 'Aves': '🍗', 'Peixes': '🐟', 'Molhos': '🫙',
  'Guarnições': '🥗', 'Sobremesas': '🍮', 'Massas': '🍝', 'Outros': '🍳'
}

const ETAPAS = ['Produto', 'Fornecedor', 'Produção', 'Resultado']

function calcularResultado({ pesoCruKg, pesoAposLimpezaKg, pesoProntoKg, ingredientes, porcaoPadraoG, metaRendimento }) {
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
  excelente: { label: '🏆 Rendimento excelente! Parabéns!', bg: 'rgba(34,197,94,0.12)',  cor: 'var(--cor-sucesso)', emoji: '🏆' },
  meta:      { label: '✅ Dentro da meta. Bom trabalho!',   bg: 'rgba(59,130,246,0.12)', cor: 'var(--cor-info)',    emoji: '✅' },
  atencao:   { label: '⚠️ Atenção — rendimento abaixo da meta', bg: 'rgba(245,158,11,0.12)', cor: 'var(--cor-atencao)', emoji: '⚠️' },
  perda:     { label: '❌ Perda alta — verifique o processo',   bg: 'rgba(239,68,68,0.12)',  cor: 'var(--cor-perigo)', emoji: '❌' },
}

export default function KitchenProduction() {
  const [etapa, setEtapa] = useState(0)
  const [empresaId, setEmpresaId] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [produtoId, setProdutoId] = useState('')
  const [fornecedorId, setFornecedorId] = useState('')
  const [pesoCruKg, setPesoCruKg] = useState('')
  const [pesoAposLimpezaKg, setPesoAposLimpezaKg] = useState('')
  const [pesoProntoKg, setPesoProntoKg] = useState('')
  const [ingredientes, setIngredientes] = useState([])
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [ultimaProducao, setUltimaProducao] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [fichaAberta, setFichaAberta] = useState(false)
  const [fichaOriginal, setFichaOriginal] = useState([]) // quantidades padrão da ficha

  // Para sugestão de novo fornecedor
  const [sugerindoFornecedor, setSugerindoFornecedor] = useState(false)
  const [novoFornNome, setNovoFornNome] = useState('')
  const [novoFornContato, setNovoFornContato] = useState('')
  const [fornSugerido, setFornSugerido] = useState(false)

  useEffect(() => {
    // Busca empresa_id do usuário logado
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
        .then(({ data }) => setEmpresaId(data?.empresa_id))
    })
    supabase.from('produtos').select('id, nome, porcao_padrao_g, meta_rendimento, categoria, modo_preparo').then(({ data }) => setProdutos(data || []))
    // Mostra fornecedores aprovados — fallback para todos caso coluna ainda não exista
    supabase.from('fornecedores').select('id, nome, aprovado')
      .then(({ data }) => setFornecedores((data || []).filter(f => f.aprovado !== false)))
  }, [])

  async function aoSelecionarProduto(p) {
    setProdutoId(p.id)
    setProdutoSelecionado(p)
    const { data } = await supabase
      .from('produto_ingredientes')
      .select('*, insumos(id, nome, preco_por_kg, unidade_padrao)')
      .eq('produto_id', p.id)
    const ings = (data || []).map(pi => ({
      insumo_id: pi.insumo_id,
      nome: pi.insumos.nome,
      preco_por_kg: pi.insumos.preco_por_kg,
      unidade: pi.unidade_uso || pi.insumos.unidade_padrao,
      quantidade: '',
      qtd_padrao: pi.quantidade_padrao || 0, // guarda o padrão para escala
      padrao: true,
    }))
    setIngredientes(ings)
    setFichaOriginal(ings) // salva cópia das quantidades originais
  }

  function atualizarQtd(idx, valor) {
    setIngredientes(prev => prev.map((ing, i) => i === idx ? { ...ing, quantidade: valor } : ing))
  }

  function removerIngrediente(idx) {
    setIngredientes(prev => prev.filter((_, i) => i !== idx))
  }

  // Calcula escala com base no peso cru informado
  // O ingrediente de maior peso na ficha é usado como referência
  function calcularEscala(pesoCruAtual) {
    const val = parseFloat(pesoCruAtual)
    if (!val || fichaOriginal.length === 0) return

    // Encontra ingrediente de maior quantidade em kg
    const ingRef = fichaOriginal.reduce((max, ing) => {
      const qKg = ing.unidade === 'g' ? (ing.qtd_padrao || 0) / 1000 : (ing.qtd_padrao || 0)
      const maxKg = max.unidade === 'g' ? (max.qtd_padrao || 0) / 1000 : (max.qtd_padrao || 0)
      return qKg > maxKg ? ing : max
    }, fichaOriginal[0])

    const baseKg = ingRef.unidade === 'g' ? (ingRef.qtd_padrao || 0) / 1000 : (ingRef.qtd_padrao || 0)
    if (!baseKg) return

    const fator = val / baseKg

    setIngredientes(prev => prev.map(ing => {
      const orig = fichaOriginal.find(o => o.insumo_id === ing.insumo_id)
      if (!orig || !orig.qtd_padrao) return ing
      const novaQtd = (orig.qtd_padrao * fator).toFixed(3)
      return { ...ing, quantidade: novaQtd }
    }))
  }

  function adicionarExtra() {
    setIngredientes(prev => [...prev, { insumo_id: '', nome: 'Extra', preco_por_kg: 0, unidade: 'kg', quantidade: '', padrao: false }])
  }

  async function sugerirFornecedor(e) {
    e.preventDefault()
    if (!novoFornNome.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('fornecedores').insert({
      empresa_id: empresaId, nome: novoFornNome.trim(), contato: novoFornContato.trim(),
      aprovado: false, sugerido_por: user?.id,
    })
    setFornSugerido(true)
    setSugerindoFornecedor(false)
    setNovoFornNome(''); setNovoFornContato('')
  }

  async function salvarProducao() {
    setErro(''); setSalvando(true)

    const calc = calcularResultado({
      pesoCruKg: parseFloat(pesoCruKg),
      pesoAposLimpezaKg: parseFloat(pesoAposLimpezaKg),
      pesoProntoKg: parseFloat(pesoProntoKg),
      ingredientes: ingredientes.map(i => ({ ...i, quantidade: parseFloat(i.quantidade) || 0 })),
      porcaoPadraoG: produtoSelecionado?.porcao_padrao_g || 100,
      metaRendimento: produtoSelecionado?.meta_rendimento || 70,
    })

    const { data: producao, error } = await supabase
      .from('producoes')
      .insert({
        empresa_id: empresaId,
        produto_id: produtoId,
        fornecedor_id: fornecedorId || null,
        peso_cru_kg: parseFloat(pesoCruKg),
        peso_apos_limpeza_kg: parseFloat(pesoAposLimpezaKg),
        peso_pronto_kg: parseFloat(pesoProntoKg),
        perda_limpeza_kg: calc.perdaLimpeza, perda_preparo_kg: calc.perdaPreparo, perda_total_kg: calc.perdaTotal,
        percentual_perda: calc.percentualPerda, rendimento: calc.rendimento,
        custo_total: calc.custoTotal, custo_por_kg_pronto: calc.custoPorKgPronto, custo_porcao: calc.custoPorcao,
        status: calc.status,
      })
      .select().single()

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      setSalvando(false); return
    }

    const ings = ingredientes
      .filter(i => i.insumo_id && parseFloat(i.quantidade) > 0)
      .map(i => ({ producao_id: producao.id, insumo_id: i.insumo_id, quantidade: parseFloat(i.quantidade), unidade: i.unidade, custo_unitario: i.preco_por_kg }))
    if (ings.length > 0) await supabase.from('producao_ingredientes').insert(ings)

    // Gamificação: busca última produção do mesmo produto
    const { data: ultima } = await supabase
      .from('producoes').select('rendimento, custo_porcao, created_at')
      .eq('produto_id', produtoId).neq('id', producao.id)
      .order('created_at', { ascending: false }).limit(1).single()

    setUltimaProducao(ultima || null)
    setResultado(calc)
    setEtapa(3)
    setSalvando(false)
  }

  function reiniciar() {
    setEtapa(0); setProdutoId(''); setFornecedorId(''); setPesoCruKg('')
    setPesoAposLimpezaKg(''); setPesoProntoKg(''); setIngredientes([])
    setProdutoSelecionado(null); setResultado(null); setUltimaProducao(null)
    setFornSugerido(false); setSugerindoFornecedor(false)
  }

  // Agrupa produtos por categoria
  const porCategoria = produtos.reduce((acc, p) => {
    const cat = p.categoria || 'Outros'
    if (!acc[cat]) acc[cat] = []; acc[cat].push(p); return acc
  }, {})

  return (
    <div className="wizard-container">
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Nova Produção</h1>
          <p className="pagina-subtitulo">Etapa {etapa + 1} de {ETAPAS.length} — {ETAPAS[etapa]}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="wizard-steps">
        {ETAPAS.map((_, i) => (
          <div key={i} className={`wizard-step ${i < etapa ? 'completo' : i === etapa ? 'ativo' : ''}`} />
        ))}
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {/* ══ ETAPA 0 — Produto ══════════════════════════════ */}
      {etapa === 0 && (
        <div className="card">
          <h2 className="wizard-titulo">O que você vai produzir?</h2>
          <p className="wizard-subtitulo">Toque no produto desta produção.</p>

          {Object.entries(porCategoria).map(([cat, lista]) => (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cor-texto-suave)', marginBottom: '10px' }}>
                {EMOJI_PRODUTO[cat] || '🍽️'} {cat}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                {lista.map(p => (
                  <button key={p.id} onClick={() => aoSelecionarProduto(p)} style={{
                    padding: '20px 16px', borderRadius: '14px', border: '2.5px solid',
                    borderColor: produtoId === p.id ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                    background: produtoId === p.id ? 'rgba(249,115,22,0.08)' : 'var(--cor-fundo-card)',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    boxShadow: produtoId === p.id ? '0 0 0 3px rgba(249,115,22,0.15)' : 'none',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', margin: '0 auto 8px',
                      background: produtoId === p.id ? 'var(--cor-primaria)' : 'var(--cor-fundo)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: EMOJI_PRODUTO[p.categoria] !== '🍳' ? '1.4rem' : '0.85rem',
                      fontWeight: 800,
                      color: produtoId === p.id ? 'white' : 'var(--cor-texto-suave)',
                    }}>
                      {EMOJI_PRODUTO[p.categoria] !== '🍳' ? EMOJI_PRODUTO[p.categoria] : p.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: produtoId === p.id ? 'var(--cor-primaria)' : 'var(--cor-texto)', lineHeight: 1.3 }}>
                      {p.nome}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '4px' }}>
                      Meta {p.meta_rendimento}%
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {produtos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--cor-texto-suave)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
              Nenhum produto cadastrado ainda.<br />Peça ao administrativo para cadastrar.
            </div>
          )}

          <div className="wizard-navegacao">
            <button className="btn btn-primario" onClick={() => setEtapa(1)} disabled={!produtoId} style={{ flex: 1, fontSize: '1.05rem' }}>
              Próximo → Fornecedor
            </button>
          </div>
        </div>
      )}

      {/* ══ ETAPA 1 — Fornecedor ══════════════════════════ */}
      {etapa === 1 && (
        <div className="card">
          <h2 className="wizard-titulo">🚚 Qual o fornecedor?</h2>
          <p className="wizard-subtitulo">De onde veio a matéria-prima? (Opcional)</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {fornecedores.map(f => (
              <button key={f.id} onClick={() => setFornecedorId(f.id)} style={{
                padding: '16px', borderRadius: '12px', border: '2.5px solid',
                borderColor: fornecedorId === f.id ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                background: fornecedorId === f.id ? 'rgba(249,115,22,0.08)' : 'var(--cor-fundo-card)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                boxShadow: fornecedorId === f.id ? '0 0 0 3px rgba(249,115,22,0.15)' : 'none',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🏭</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: fornecedorId === f.id ? 'var(--cor-primaria)' : 'var(--cor-texto)' }}>
                  {f.nome}
                </div>
              </button>
            ))}
            {fornecedores.length === 0 && !fornSugerido && (
              <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem', gridColumn: '1/-1' }}>
                Nenhum fornecedor cadastrado ainda.
              </p>
            )}
          </div>

          {/* Sugestão de novo fornecedor */}
          {fornSugerido ? (
            <div className="mensagem-sucesso">
              ✅ Fornecedor sugerido com sucesso! O gestor irá revisar e aprovar em breve.
            </div>
          ) : sugerindoFornecedor ? (
            <div style={{ background: 'rgba(249,115,22,0.07)', border: '2px solid var(--cor-primaria)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, color: 'var(--cor-primaria)', marginBottom: '12px' }}>➕ Sugerir novo fornecedor</div>
              <form onSubmit={sugerirFornecedor}>
                <div className="campo-grupo">
                  <label>Nome do fornecedor</label>
                  <input value={novoFornNome} onChange={e => setNovoFornNome(e.target.value)} placeholder="Ex: Frigorífico Central" required />
                </div>
                <div className="campo-grupo">
                  <label>Contato (opcional)</label>
                  <input value={novoFornContato} onChange={e => setNovoFornContato(e.target.value)} placeholder="Telefone ou e-mail" />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primario" style={{ flex: 1 }}>Enviar sugestão</button>
                  <button type="button" className="btn btn-secundario" onClick={() => setSugerindoFornecedor(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          ) : (
            <button className="btn btn-secundario" onClick={() => setSugerindoFornecedor(true)} style={{ width: '100%', marginBottom: '12px' }}>
              🏭 Meu fornecedor não está na lista — sugerir novo
            </button>
          )}

          <div className="wizard-navegacao">
            <button className="btn btn-secundario" onClick={() => setEtapa(0)} style={{ flex: 1 }}>← Voltar</button>
            <button className="btn btn-primario" onClick={() => setEtapa(2)} style={{ flex: 1, fontSize: '1.05rem' }}>
              Próximo → Registrar
            </button>
          </div>
        </div>
      )}

      {/* ══ ETAPA 2 — Produção (pesos + ingredientes juntos) ══ */}
      {etapa === 2 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
              background: 'var(--cor-primaria)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 800,
            }}>
              {EMOJI_PRODUTO[produtoSelecionado?.categoria] !== '🍽️'
                ? EMOJI_PRODUTO[produtoSelecionado?.categoria] || produtoSelecionado?.nome?.[0]?.toUpperCase()
                : produtoSelecionado?.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>{produtoSelecionado?.nome}</h2>
              <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem', margin: 0 }}>Registre os pesos e os ingredientes utilizados</p>
            </div>
          </div>

          {/* Botão consultar ficha técnica */}
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => setFichaAberta(!fichaAberta)}
              style={{
                background: 'none', border: '1px solid var(--cor-borda)', borderRadius: '8px',
                padding: '7px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                color: 'var(--cor-texto-suave)', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cor-primaria)'; e.currentTarget.style.color = 'var(--cor-primaria)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.color = 'var(--cor-texto-suave)' }}
            >
              📋 {fichaAberta ? 'Fechar ficha técnica' : 'Consultar ficha técnica'}
            </button>

            {fichaAberta && (
              <div style={{ marginTop: '10px', background: 'var(--cor-fundo)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--cor-borda)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cor-texto-suave)', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  Receita padrão — {produtoSelecionado?.nome}
                </div>
                {fichaOriginal.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>Nenhum ingrediente cadastrado na ficha técnica.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {fichaOriginal.map((ing, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--cor-fundo-card)', borderRadius: '6px', border: '1px solid var(--cor-borda)' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ing.nome}</span>
                        <span style={{ fontWeight: 700, color: 'var(--cor-primaria)', fontSize: '0.88rem' }}>
                          {ing.qtd_padrao > 0 ? `${ing.qtd_padrao} ${ing.unidade}` : <span style={{ color: 'var(--cor-texto-suave)', fontStyle: 'italic' }}>livre</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {produtoSelecionado?.modo_preparo && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--cor-fundo-card)', borderRadius: '8px', border: '1px solid var(--cor-borda)', fontSize: '0.85rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--cor-texto)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cor-texto-suave)', marginBottom: '6px' }}>📝 Modo de preparo</div>
                    {produtoSelecionado.modo_preparo}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--cor-borda)', margin: '16px 0' }} />

          <div className="wizard-producao-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            {/* COLUNA ESQUERDA — Pesos */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cor-texto-suave)', marginBottom: '14px' }}>
                ⚖️ Pesagens
              </div>
              <div className="campo-grupo">
                <label>🥩 Peso cru (kg)</label>
                <input type="number" step="0.001" min="0" placeholder="Ex: 25.000"
                  value={pesoCruKg} onChange={e => {
                    setPesoCruKg(e.target.value)
                    calcularEscala(e.target.value)
                  }} />
                <span className="ajuda">
                  Antes de qualquer limpeza
                  {fichaOriginal.some(i => i.qtd_padrao > 0) && (
                    <span style={{ color: 'var(--cor-primaria)', marginLeft: '6px' }}>
                      · quantidades calculadas automaticamente
                    </span>
                  )}
                </span>
              </div>
              <div className="campo-grupo">
                <label>✂️ Após limpeza / aparas (kg)</label>
                <input type="number" step="0.001" min="0" placeholder="Ex: 22.000"
                  value={pesoAposLimpezaKg} onChange={e => setPesoAposLimpezaKg(e.target.value)} />
                <span className="ajuda">Após tirar gordura, osso, casca</span>
              </div>
              <div className="campo-grupo">
                <label>🍽️ Peso final pronto (kg)</label>
                <input type="number" step="0.001" min="0" placeholder="Ex: 16.000"
                  value={pesoProntoKg} onChange={e => setPesoProntoKg(e.target.value)} />
                <span className="ajuda">Após cozinhar ou finalizar</span>
              </div>
            </div>

            {/* COLUNA DIREITA — Ingredientes */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cor-texto-suave)', marginBottom: '14px' }}>
                🧂 Ingredientes utilizados
              </div>

              {ingredientes.length === 0 && (
                <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>
                  Nenhum ingrediente padrão cadastrado. Use o botão abaixo para adicionar.
                </p>
              )}

              {ingredientes.map((ing, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cor-texto)' }}>
                      {ing.nome || `Ingrediente extra ${idx + 1}`}
                    </label>
                    {!ing.padrao && (
                      <button onClick={() => removerIngrediente(idx)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.85rem',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--cor-perigo)'}
                        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                      >✕ remover</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="number" step="0.001" min="0" placeholder="Qtd"
                      value={ing.quantidade} onChange={e => atualizarQtd(idx, e.target.value)}
                      style={{ flex: 1, padding: '10px 12px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit' }} />
                    <span style={{ minWidth: '34px', fontWeight: 700, color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>{ing.unidade}</span>
                  </div>
                </div>
              ))}

              <button className="btn btn-secundario" onClick={adicionarExtra} style={{ width: '100%', marginTop: '4px', padding: '10px' }}>
                ➕ Adicionar ingrediente extra
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--cor-borda)', marginTop: '20px', paddingTop: '16px' }}>
            <div className="wizard-navegacao">
              <button className="btn btn-secundario" onClick={() => setEtapa(1)} style={{ flex: 1 }}>← Voltar</button>
              <button
                className="btn btn-primario"
                onClick={salvarProducao}
                disabled={salvando || !pesoCruKg || !pesoAposLimpezaKg || !pesoProntoKg}
                style={{ flex: 2, fontSize: '1.05rem' }}
              >
                {salvando ? '⏳ Salvando...' : '✅ Salvar produção'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ETAPA 3 — Resultado com gamificação ═══════════ */}
      {etapa === 3 && resultado && (
        <div className="card">
          {/* Badge de status grande */}
          <div style={{
            textAlign: 'center', padding: '24px', borderRadius: '16px', marginBottom: '24px',
            background: STATUS_CONFIG[resultado.status]?.bg,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{STATUS_CONFIG[resultado.status]?.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: STATUS_CONFIG[resultado.status]?.cor }}>
              {STATUS_CONFIG[resultado.status]?.label}
            </div>
            <div style={{ fontSize: '0.9rem', color: STATUS_CONFIG[resultado.status]?.cor, marginTop: '4px', opacity: 0.8 }}>
              {produtoSelecionado?.nome}
            </div>
          </div>

          {/* Comparação com produção anterior (gamificação) */}
          {ultimaProducao && (
            <div style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cor-texto-suave)', marginBottom: '12px', letterSpacing: '0.04em' }}>
                📊 Comparado com sua última produção
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <Comparativo
                  label="Rendimento"
                  atual={`${resultado.rendimento.toFixed(1)}%`}
                  anterior={`${parseFloat(ultimaProducao.rendimento || 0).toFixed(1)}%`}
                  delta={resultado.rendimento - parseFloat(ultimaProducao.rendimento || 0)}
                  melhorQuandoMaior
                />
                <Comparativo
                  label="Custo/porção"
                  atual={`R$ ${resultado.custoPorcao.toFixed(2)}`}
                  anterior={`R$ ${parseFloat(ultimaProducao.custo_porcao || 0).toFixed(2)}`}
                  delta={resultado.custoPorcao - parseFloat(ultimaProducao.custo_porcao || 0)}
                  melhorQuandoMaior={false}
                  prefixo="R$ "
                />
              </div>
            </div>
          )}

          {/* Métricas */}
          <div className="grid-metricas" style={{ marginBottom: '16px' }}>
            <div className="card" style={{ padding: '16px', borderTop: '3px solid var(--cor-primaria)' }}>
              <div className="card-titulo">Rendimento</div>
              <div className="card-valor">{resultado.rendimento.toFixed(1)}%</div>
              <div className="card-subtexto">Meta: {produtoSelecionado?.meta_rendimento}%</div>
            </div>
            <div className="card" style={{ padding: '16px', borderTop: '3px solid var(--cor-perigo)' }}>
              <div className="card-titulo">Perda total</div>
              <div className="card-valor">{resultado.percentualPerda.toFixed(1)}%</div>
              <div className="card-subtexto">{resultado.perdaTotal.toFixed(3)} kg</div>
            </div>
            <div className="card" style={{ padding: '16px', borderTop: '3px solid #3b82f6' }}>
              <div className="card-titulo">Custo/kg pronto</div>
              <div className="card-valor">R$ {resultado.custoPorKgPronto.toFixed(2)}</div>
            </div>
            <div className="card" style={{ padding: '16px', borderTop: '3px solid #22c55e' }}>
              <div className="card-titulo">Custo da porção</div>
              <div className="card-valor">R$ {resultado.custoPorcao.toFixed(2)}</div>
              <div className="card-subtexto">{produtoSelecionado?.porcao_padrao_g}g</div>
            </div>
          </div>

          <div style={{ background: 'var(--cor-fundo)', borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>✂️ Perda na limpeza: <strong>{(parseFloat(pesoCruKg) - parseFloat(pesoAposLimpezaKg)).toFixed(3)} kg</strong></span>
            <span>🔥 Perda no preparo: <strong>{(parseFloat(pesoAposLimpezaKg) - parseFloat(pesoProntoKg)).toFixed(3)} kg</strong></span>
          </div>

          <button className="btn btn-primario btn-grande" onClick={reiniciar} style={{ fontSize: '1.1rem' }}>
            🍳 Registrar nova produção
          </button>
        </div>
      )}
    </div>
  )
}

function Comparativo({ label, atual, anterior, delta, melhorQuandoMaior, prefixo = '' }) {
  const abs = Math.abs(delta).toFixed(prefixo ? 2 : 1)
  const melhorou = melhorQuandoMaior ? delta > 0 : delta < 0
  const igual = Math.abs(delta) < 0.01
  const icone = igual ? '=' : delta > 0 ? '▲' : '▼'
  const cor = igual ? 'var(--cor-texto-suave)' : melhorou ? 'var(--cor-sucesso)' : 'var(--cor-perigo)'

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{atual}</div>
      <div style={{ fontSize: '0.8rem', color: cor, fontWeight: 600 }}>
        {icone} {prefixo}{abs} vs anterior ({anterior})
      </div>
    </div>
  )
}
