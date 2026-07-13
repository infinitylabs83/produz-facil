import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import FichaTecnicaPrint from '../components/FichaTecnicaPrint'
import ImportarReceitaPDF from '../components/ImportarReceitaPDF'

const ABAS = ['Produtos & Fichas', 'Insumos', 'Fornecedores']

const CATEGORIAS_PRODUTO = ['Carnes', 'Aves', 'Peixes', 'Molhos', 'Guarnições', 'Sobremesas', 'Massas', 'Outros']
const CATEGORIAS_INSUMO  = ['Carnes e Aves', 'Peixes e Frutos do Mar', 'Laticínios e Ovos', 'Hortifruti', 'Temperos e Condimentos', 'Óleos e Gorduras', 'Grãos e Cereais', 'Molhos e Caldos', 'Bebidas', 'Embalagens', 'Outros']

const COR_CAT = {
  'Carnes e Aves': 'rgba(239,68,68,0.12)', 'Peixes e Frutos do Mar': 'rgba(59,130,246,0.12)',
  'Laticínios e Ovos': 'rgba(245,158,11,0.12)', 'Hortifruti': 'rgba(34,197,94,0.12)',
  'Temperos e Condimentos': 'rgba(168,85,247,0.12)', 'Óleos e Gorduras': 'rgba(249,115,22,0.12)',
  'Grãos e Cereais': 'rgba(234,179,8,0.12)', 'Molhos e Caldos': 'rgba(236,72,153,0.12)',
  'Bebidas': 'rgba(6,182,212,0.12)', 'Embalagens': 'rgba(100,116,139,0.12)', 'Outros': 'rgba(100,116,139,0.12)',
}

// Mostra há quantos dias o preço não é atualizado
function SemRevisao({ historico }) {
  const ultima = historico.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  if (!ultima) return null
  const dias = Math.floor((Date.now() - new Date(ultima.created_at)) / (1000 * 60 * 60 * 24))
  if (dias < 15) return null
  const cor  = dias >= 30 ? 'var(--cor-perigo)' : 'var(--cor-atencao)'
  const bg   = dias >= 30 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
  return (
    <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '0.7rem', fontWeight: 700, color: cor, background: bg, padding: '1px 7px', borderRadius: '10px' }}>
      {dias}d sem revisão
    </span>
  )
}

function useEmpresaId() {
  const [empresaId, setEmpresaId] = useState(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
        .then(({ data }) => setEmpresaId(data?.empresa_id ?? null))
    })
  }, [])
  return empresaId
}

export default function AdminCadastros() {
  const [aba, setAba] = useState(0)

  return (
    <div>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Cadastros</h1>
          <p className="pagina-subtitulo">Produtos com fichas técnicas, insumos e fornecedores</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--cor-borda)' }}>
        {ABAS.map((a, i) => (
          <button key={i} onClick={() => setAba(i)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.95rem',
            color: aba === i ? 'var(--cor-primaria)' : 'var(--cor-texto-suave)',
            borderBottom: aba === i ? '2px solid var(--cor-primaria)' : '2px solid transparent',
            marginBottom: '-2px', transition: 'all 0.15s',
          }}>
            {a}
          </button>
        ))}
      </div>

      {aba === 0 && <ProdutosComFicha />}
      {aba === 1 && <CadastroInsumos />}
      {aba === 2 && <CadastroFornecedores />}
    </div>
  )
}

/* =====================================================
   PRODUTOS + FICHAS TÉCNICAS (master-detail)
   ===================================================== */
function ProdutosComFicha() {
  const empresaId = useEmpresaId()
  const [produtos, setProdutos] = useState([])
  const [insumos, setInsumos]   = useState([])
  const [selecionado, setSelecionado] = useState(null) // produto ativo
  const [modo, setModo] = useState('ver')              // 'ver' | 'novo' | 'editar'
  const [busca, setBusca] = useState('')

  // campos do formulário de produto
  const [fNome, setFNome]         = useState('')
  const [fPorcao, setFPorcao]     = useState('')
  const [fMeta, setFMeta]         = useState('')
  const [fCategoria, setFCategoria] = useState('Outros')

  // ficha técnica do produto selecionado
  const [ficha, setFicha]           = useState([])
  const [adicionandoIng, setAdicionandoIng] = useState(false)
  const [ingInsumoId, setIngInsumoId]   = useState('')
  const [ingQtd, setIngQtd]             = useState('')
  const [ingUnidade, setIngUnidade]     = useState('kg')

  // modo de preparo e foto
  const [modoPreparoTexto, setModoPreparoTexto] = useState('')
  const [salvandoPreparo, setSalvandoPreparo]   = useState(false)
  const [uploadingFoto, setUploadingFoto]       = useState(false)

  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg]           = useState('')
  const [erro, setErro]         = useState('')
  const [printAberto, setPrintAberto] = useState(false)
  const [pdfModalAberto, setPdfModalAberto] = useState(false)

  // carrega dados iniciais
  useEffect(() => {
    carregarProdutos()
    supabase.from('insumos').select('id, nome, preco_por_kg, unidade_padrao').order('nome')
      .then(({ data }) => setInsumos(data || []))
  }, [])

  async function carregarProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('categoria').order('nome')
    setProdutos(data || [])
  }

  async function carregarFicha(prodId) {
    const { data } = await supabase
      .from('produto_ingredientes')
      .select('id, quantidade_padrao, unidade_uso, insumo_id, insumos(id, nome, preco_por_kg, unidade_padrao)')
      .eq('produto_id', prodId)
    setFicha(data || [])
  }

  function selecionarProduto(p) {
    setSelecionado(p)
    setModo('ver')
    setAdicionandoIng(false)
    setErro(''); setMsg('')
    setModoPreparoTexto(p.modo_preparo || '')
    carregarFicha(p.id)
  }

  async function salvarModoPreparo() {
    setSalvandoPreparo(true)
    await supabase.from('produtos').update({ modo_preparo: modoPreparoTexto }).eq('id', selecionado.id)
    setSelecionado(prev => ({ ...prev, modo_preparo: modoPreparoTexto }))
    setSalvandoPreparo(false)
    setMsg('Modo de preparo salvo!'); setTimeout(() => setMsg(''), 2000)
  }

  async function uploadFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const path = `${selecionado.id}_${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('produtos').upload(path, file, { upsert: true })
    if (error) { alert('Erro no upload: ' + error.message); setUploadingFoto(false); return }
    const { data: { publicUrl } } = supabase.storage.from('produtos').getPublicUrl(data.path)
    await supabase.from('produtos').update({ foto_url: publicUrl }).eq('id', selecionado.id)
    setSelecionado(prev => ({ ...prev, foto_url: publicUrl }))
    setUploadingFoto(false)
    setMsg('Foto atualizada!'); setTimeout(() => setMsg(''), 2000)
  }

  function iniciarNovo() {
    setSelecionado(null); setModo('novo')
    setFNome(''); setFPorcao(''); setFMeta(''); setFCategoria('Outros')
    setFicha([]); setErro(''); setMsg('')
  }

  function iniciarEdicao() {
    setModo('editar')
    setFNome(selecionado.nome)
    setFPorcao(selecionado.porcao_padrao_g)
    setFMeta(selecionado.meta_rendimento)
    setFCategoria(selecionado.categoria || 'Outros')
    setErro(''); setMsg('')
  }

  async function salvarProduto(e) {
    e.preventDefault()
    setErro(''); setMsg('')
    if (!empresaId && modo === 'novo') { setErro('Empresa não encontrada. Faça logout e entre novamente.'); return }
    setSalvando(true)

    if (modo === 'novo') {
      const { data, error } = await supabase.from('produtos').insert({
        empresa_id: empresaId, nome: fNome,
        porcao_padrao_g: parseFloat(fPorcao) || 100,
        meta_rendimento: parseFloat(fMeta) || 70,
        categoria: fCategoria,
      }).select().single()
      setSalvando(false)
      if (error) { setErro('Erro: ' + error.message); return }
      setMsg('Produto criado! Agora adicione os ingredientes da ficha técnica.')
      await carregarProdutos()
      setSelecionado(data); setModo('ver'); carregarFicha(data.id)

    } else if (modo === 'editar') {
      const { error } = await supabase.from('produtos').update({
        nome: fNome,
        porcao_padrao_g: parseFloat(fPorcao) || 100,
        meta_rendimento: parseFloat(fMeta) || 70,
        categoria: fCategoria,
      }).eq('id', selecionado.id)
      setSalvando(false)
      if (error) { setErro('Erro: ' + error.message); return }
      setMsg('Produto atualizado!')
      await carregarProdutos()
      setSelecionado(prev => ({ ...prev, nome: fNome, porcao_padrao_g: parseFloat(fPorcao), meta_rendimento: parseFloat(fMeta), categoria: fCategoria }))
      setModo('ver')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function excluirProduto() {
    if (!window.confirm(`Excluir "${selecionado.nome}" e toda a ficha técnica?`)) return
    await supabase.from('produtos').delete().eq('id', selecionado.id)
    setSelecionado(null); setModo('novo'); setFicha([])
    carregarProdutos()
  }

  // ── Edição inline de ingredientes já na ficha ──
  const [editIngId, setEditIngId]       = useState(null)
  const [editIngQtd, setEditIngQtd]     = useState('')
  const [editIngUnd, setEditIngUnd]     = useState('kg')

  function iniciarEdicaoIng(f) {
    setEditIngId(f.id)
    setEditIngQtd(f.quantidade_padrao ?? '')
    setEditIngUnd(f.unidade_uso || 'kg')
  }

  async function salvarEdicaoIng(id) {
    await supabase.from('produto_ingredientes').update({
      quantidade_padrao: parseFloat(editIngQtd) || null,
      unidade_uso: editIngUnd,
    }).eq('id', id)
    setEditIngId(null)
    carregarFicha(selecionado.id)
  }

  // ── Ficha técnica ──
  function selecionarInsumoFicha(id) {
    setIngInsumoId(id)
    const ins = insumos.find(i => i.id === id)
    if (ins) setIngUnidade(ins.unidade_padrao)
  }

  async function adicionarIngrediente(e) {
    e.preventDefault()
    setErro('')
    if (!ingInsumoId) { setErro('Selecione um insumo.'); return }
    if (ficha.some(f => f.insumo_id === ingInsumoId)) { setErro('Este insumo já está na ficha.'); return }
    const { error } = await supabase.from('produto_ingredientes').insert({
      produto_id: selecionado.id, insumo_id: ingInsumoId,
      quantidade_padrao: parseFloat(ingQtd) || null, unidade_uso: ingUnidade,
    })
    if (error) { setErro('Erro: ' + error.message); return }
    setIngInsumoId(''); setIngQtd(''); setIngUnidade('kg')
    setAdicionandoIng(false)
    carregarFicha(selecionado.id)
  }

  async function removerIngrediente(id) {
    if (!window.confirm('Remover este ingrediente da ficha?')) return
    await supabase.from('produto_ingredientes').delete().eq('id', id)
    carregarFicha(selecionado.id)
  }

  // Salva ingredientes importados via PDF na ficha técnica
  async function salvarReceitaPDF(ingredientes) {
    for (const ing of ingredientes) {
      if (!ing.insumoId) continue
      // Evita duplicar insumos já existentes na ficha
      if (ficha.some(f => f.insumo_id === ing.insumoId)) continue
      await supabase.from('produto_ingredientes').insert({
        produto_id: selecionado.id,
        insumo_id: ing.insumoId,
        quantidade_padrao: ing.qtd || null,
        unidade_uso: ing.unidade || 'kg',
      })
    }
    await carregarFicha(selecionado.id)
  }

  // Custo total de todos os ingredientes
  const custoFicha = ficha.reduce((acc, f) => {
    const q = f.quantidade_padrao || 0
    const qKg = f.unidade_uso === 'g' ? q / 1000 : q
    return acc + qKg * (f.insumos?.preco_por_kg || 0)
  }, 0)

  // Peso total de todos os ingredientes (em kg)
  const pesoTotalReceita = ficha.reduce((acc, f) => {
    const q = f.quantidade_padrao || 0
    return acc + (f.unidade_uso === 'g' ? q / 1000 : q)
  }, 0)

  // Custo por kg pronto = custo total / (peso total * rendimento%)
  const metaRend = (selecionado?.meta_rendimento || 100) / 100
  const custoPorKgFicha = pesoTotalReceita > 0
    ? custoFicha / (pesoTotalReceita * metaRend)
    : 0

  // Custo da porção = custo/kg * porção em kg
  const custoPorcaoFicha = custoPorKgFicha * ((selecionado?.porcao_padrao_g || 0) / 1000)

  const insumosDisponiveis = insumos.filter(i => !ficha.some(f => f.insumo_id === i.id))

  // filtra por busca e agrupa por categoria (itens FAB vão para "Fabricação")
  const ORDEM_CAT = ['Fabricação', 'Carnes', 'Aves', 'Peixes', 'Molhos', 'Guarnições', 'Sobremesas', 'Massas', 'Adicional', 'Outros']

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const porCategoria = produtosFiltrados.reduce((acc, p) => {
    const cat = p.nome.toUpperCase().includes('FAB') ? 'Fabricação' : (p.categoria || 'Outros')
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p); return acc
  }, {})

  const porCategoriaOrdenado = Object.fromEntries(
    ORDEM_CAT.filter(c => porCategoria[c]).map(c => [c, porCategoria[c]])
      .concat(Object.entries(porCategoria).filter(([c]) => !ORDEM_CAT.includes(c)))
  )

  return (
    <div className="cadastros-grid">

      {/* PAINEL ESQUERDO — lista de produtos */}
      <div>
        <button className="btn btn-primario" onClick={iniciarNovo} style={{ width: '100%', marginBottom: '10px' }}>
          ＋ Novo Produto
        </button>

        {/* Campo de busca */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cor-texto-suave)', fontSize: '0.95rem', pointerEvents: 'none' }}>🔍</span>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.88rem', fontFamily: 'inherit', background: 'var(--cor-fundo-card)', color: 'var(--cor-texto)', boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--cor-primaria)'}
            onBlur={e => e.target.style.borderColor = 'var(--cor-borda)'}
          />
          {busca && (
            <button onClick={() => setBusca('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cor-texto-suave)', fontSize: '1rem', lineHeight: 1, padding: '2px' }}>✕</button>
          )}
        </div>

        {busca && (
          <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginBottom: '8px' }}>
            {produtosFiltrados.length} resultado(s) para "{busca}"
          </div>
        )}

        {produtos.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--cor-texto-suave)', padding: '24px', fontSize: '0.9rem' }}>
            Nenhum produto cadastrado. Clique em <strong>+ Novo Produto</strong>.
          </div>
        )}

        {produtosFiltrados.length === 0 && busca && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>
            Nenhum produto encontrado.
          </div>
        )}

        {Object.entries(porCategoriaOrdenado).map(([cat, lista]) => (
          <div key={cat} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', paddingLeft: '2px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: cat === 'Fabricação' ? '#f97316' : 'var(--cor-texto-suave)' }}>
                {cat === 'Fabricação' ? '🏭 ' : ''}{cat}
              </div>
              <div style={{ flex: 1, height: '1px', background: cat === 'Fabricação' ? 'rgba(249,115,22,0.3)' : 'var(--cor-borda)' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--cor-texto-suave)' }}>{lista.length}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lista.map(p => (
                <button key={p.id} onClick={() => selecionarProduto(p)} style={{
                  padding: '12px 14px', borderRadius: '10px', border: '2px solid',
                  borderColor: selecionado?.id === p.id ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                  background: selecionado?.id === p.id ? 'rgba(249,115,22,0.08)' : 'var(--cor-fundo-card)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <div style={{ fontWeight: 700, color: selecionado?.id === p.id ? 'var(--cor-primaria)' : 'var(--cor-texto)', fontSize: '0.95rem' }}>
                    {p.nome}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>
                    {p.porcao_padrao_g}g · Meta {p.meta_rendimento}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PAINEL DIREITO — detalhes + ficha técnica */}
      <div>
        {/* Estado: nada selecionado e não está criando */}
        {!selecionado && modo !== 'novo' && (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--cor-texto-suave)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Selecione um produto</div>
            <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>ou crie um novo para ver e montar a ficha técnica</div>
          </div>
        )}

        {/* Formulário de novo produto */}
        {modo === 'novo' && (
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>➕ Novo produto</h3>
            {erro && <div className="mensagem-erro">{erro}</div>}
            {msg && <div className="mensagem-sucesso">{msg}</div>}
            <form onSubmit={salvarProduto}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="campo-grupo" style={{ gridColumn: '1/-1' }}>
                  <label>Nome do produto</label>
                  <input value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Ex: Steak de Patinho" required />
                </div>
                <div className="campo-grupo">
                  <label>Categoria</label>
                  <select value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
                    {CATEGORIAS_PRODUTO.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="campo-grupo">
                  <label>Porção padrão (g)</label>
                  <input type="number" value={fPorcao} onChange={e => setFPorcao(e.target.value)} placeholder="Ex: 180" />
                </div>
                <div className="campo-grupo">
                  <label>Meta de rendimento (%)</label>
                  <input type="number" value={fMeta} onChange={e => setFMeta(e.target.value)} placeholder="Ex: 75" />
                  <span className="ajuda">% peso pronto / peso cru</span>
                </div>
              </div>
              <button className="btn btn-primario" type="submit" disabled={salvando} style={{ width: '100%', marginTop: '8px' }}>
                {salvando ? 'Salvando...' : 'Criar produto e montar ficha técnica →'}
              </button>
            </form>
          </div>
        )}

        {/* Produto selecionado — detalhe + ficha */}
        {selecionado && modo !== 'novo' && (
          <div className="card">
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selecionado.nome}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>
                  <span style={{ background: 'var(--cor-fundo)', padding: '2px 8px', borderRadius: '6px', marginRight: '8px' }}>{selecionado.categoria}</span>
                  Porção: <strong>{selecionado.porcao_padrao_g}g</strong> &nbsp;·&nbsp;
                  Meta: <strong>{selecionado.meta_rendimento}%</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {modo === 'ver' && (
                  <>
                    <button className="btn btn-secundario" onClick={iniciarEdicao} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={excluirProduto} className="badge-perigo" style={{ border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Formulário de edição inline */}
            {modo === 'editar' && (
              <div style={{ background: 'rgba(249,115,22,0.07)', border: '2px solid var(--cor-primaria)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, color: 'var(--cor-primaria)', marginBottom: '12px' }}>✏️ Editando produto</div>
                {erro && <div className="mensagem-erro">{erro}</div>}
                <form onSubmit={salvarProduto}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="campo-grupo" style={{ gridColumn: '1/-1', marginBottom: 0 }}>
                      <label>Nome</label>
                      <input value={fNome} onChange={e => setFNome(e.target.value)} required />
                    </div>
                    <div className="campo-grupo" style={{ marginBottom: 0 }}>
                      <label>Categoria</label>
                      <select value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
                        {CATEGORIAS_PRODUTO.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="campo-grupo" style={{ marginBottom: 0 }}>
                      <label>Porção (g)</label>
                      <input type="number" value={fPorcao} onChange={e => setFPorcao(e.target.value)} />
                    </div>
                    <div className="campo-grupo" style={{ marginBottom: 0 }}>
                      <label>Meta de rendimento (%)</label>
                      <input type="number" value={fMeta} onChange={e => setFMeta(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-primario" type="submit" disabled={salvando} style={{ flex: 1 }}>
                      {salvando ? 'Salvando...' : '✓ Salvar alterações'}
                    </button>
                    <button type="button" className="btn btn-secundario" onClick={() => setModo('ver')}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            {msg && <div className="mensagem-sucesso">{msg}</div>}

            {/* ── FICHA TÉCNICA ── */}
            <div style={{ borderTop: '2px solid var(--cor-borda)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>📋 Ficha Técnica</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>
                    {ficha.length} ingrediente(s) cadastrado(s)
                  </div>
                </div>
                <button
                  onClick={() => setPrintAberto(true)}
                  className="btn btn-secundario"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🖨️ Ficha Técnica Operacional
                </button>
                {ficha.length > 0 && (
                  <div style={{ textAlign: 'right', display: 'flex', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-suave)', textTransform: 'uppercase', fontWeight: 600 }}>Custo total receita</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cor-primaria)' }}>R$ {custoFicha.toFixed(2)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)' }}>{pesoTotalReceita.toFixed(3)} kg de ingredientes</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--cor-borda)', paddingLeft: '20px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-suave)', textTransform: 'uppercase', fontWeight: 600 }}>Custo/kg pronto</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b82f6' }}>R$ {custoPorKgFicha.toFixed(2)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)' }}>
                        Porção {selecionado.porcao_padrao_g}g = <strong style={{ color: '#22c55e' }}>R$ {custoPorcaoFicha.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de ingredientes */}
              {ficha.length === 0 && !adicionandoIng && (
                <div style={{ background: 'var(--cor-fundo)', borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧂</div>
                  <div style={{ fontWeight: 600 }}>Nenhum ingrediente ainda</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>Adicione os insumos que compõem esta receita</div>
                </div>
              )}

              {ficha.map((f, idx) => {
                const q = f.quantidade_padrao || 0
                const qKg = f.unidade_uso === 'g' ? q / 1000 : q
                const custo = qKg * (f.insumos?.preco_por_kg || 0)
                const editando = editIngId === f.id

                return (
                  <div key={f.id} style={{ marginBottom: '4px' }}>
                    {/* MODO VISUALIZAÇÃO */}
                    {!editando && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '8px',
                        background: 'var(--cor-fundo-card)',
                        border: '1px solid var(--cor-borda)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                            background: 'var(--cor-primaria)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.75rem',
                          }}>{idx + 1}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.insumos?.nome}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>
                              R$ {parseFloat(f.insumos?.preco_por_kg || 0).toFixed(2)}/kg
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {q > 0 ? `${q} ${f.unidade_uso}` : <span style={{ color: 'var(--cor-texto-suave)' }}>livre</span>}
                            </div>
                            {q > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--cor-primaria)', fontWeight: 700 }}>R$ {custo.toFixed(2)}</div>}
                          </div>
                          {/* Botão editar */}
                          <button onClick={() => iniciarEdicaoIng(f)} style={{
                            background: 'var(--cor-fundo)', border: 'none', borderRadius: '6px',
                            cursor: 'pointer', padding: '5px 8px', fontSize: '0.8rem',
                            color: 'var(--cor-texto-suave)', fontWeight: 600,
                          }}>✏️</button>
                          <button onClick={() => removerIngrediente(f.id)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1',
                            fontSize: '1rem', padding: '4px', lineHeight: 1,
                          }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--cor-perigo)'}
                            onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                          >✕</button>
                        </div>
                      </div>
                    )}

                    {/* MODO EDIÇÃO INLINE */}
                    {editando && (
                      <div style={{
                        padding: '12px 14px', borderRadius: '8px',
                        border: '2px solid var(--cor-primaria)', background: 'rgba(249,115,22,0.07)',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px', color: 'var(--cor-primaria)' }}>
                          ✏️ Editando: {f.insumos?.nome}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                          <div className="campo-grupo" style={{ marginBottom: 0, flex: 1 }}>
                            <label style={{ fontSize: '0.8rem' }}>Quantidade</label>
                            <input
                              type="number" step="0.001" min="0"
                              value={editIngQtd}
                              onChange={e => setEditIngQtd(e.target.value)}
                              placeholder="Ex: 1.500"
                              autoFocus
                            />
                          </div>
                          <div className="campo-grupo" style={{ marginBottom: 0, minWidth: '100px' }}>
                            <label style={{ fontSize: '0.8rem' }}>Unidade</label>
                            <select value={editIngUnd} onChange={e => setEditIngUnd(e.target.value)}>
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                              <option value="un">unidade</option>
                            </select>
                          </div>
                          <button className="btn btn-primario" onClick={() => salvarEdicaoIng(f.id)} style={{ padding: '10px 16px', marginBottom: 0 }}>
                            ✓
                          </button>
                          <button className="btn btn-secundario" onClick={() => setEditIngId(null)} style={{ padding: '10px 14px', marginBottom: 0 }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Formulário de adicionar ingrediente */}
              {adicionandoIng && (
                <div style={{ background: 'rgba(249,115,22,0.07)', border: '2px solid var(--cor-primaria)', borderRadius: '10px', padding: '14px', margin: '12px 0' }}>
                  <div style={{ fontWeight: 700, color: 'var(--cor-primaria)', marginBottom: '10px', fontSize: '0.9rem' }}>＋ Adicionar ingrediente</div>
                  {erro && <div className="mensagem-erro">{erro}</div>}
                  <form onSubmit={adicionarIngrediente}>
                    <div className="campo-grupo">
                      <label>Insumo</label>
                      <select value={ingInsumoId} onChange={e => selecionarInsumoFicha(e.target.value)} required>
                        <option value="">— selecione —</option>
                        {insumosDisponiveis.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.nome} · R$ {parseFloat(i.preco_por_kg).toFixed(2)}/{i.unidade_padrao}
                          </option>
                        ))}
                      </select>
                      {insumos.length === 0 && <span className="ajuda">Cadastre insumos na aba <strong>Insumos</strong> primeiro.</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="campo-grupo" style={{ marginBottom: 0 }}>
                        <label>Quantidade padrão</label>
                        <input type="number" step="0.001" min="0" placeholder="Ex: 1.500" value={ingQtd} onChange={e => setIngQtd(e.target.value)} />
                      </div>
                      <div className="campo-grupo" style={{ marginBottom: 0 }}>
                        <label>Unidade</label>
                        <select value={ingUnidade} onChange={e => setIngUnidade(e.target.value)}>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                          <option value="un">unidade</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button type="submit" className="btn btn-primario" style={{ flex: 1, padding: '10px' }}>✓ Confirmar</button>
                      <button type="button" className="btn btn-secundario" onClick={() => { setAdicionandoIng(false); setErro('') }} style={{ padding: '10px 16px' }}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              {!adicionandoIng && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn btn-secundario" onClick={() => { setAdicionandoIng(true); setErro('') }} style={{ flex: 1 }}>
                    ＋ Adicionar ingrediente
                  </button>
                  <button
                    className="btn btn-secundario"
                    onClick={() => setPdfModalAberto(true)}
                    title="Importar receita de um PDF"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    📄 Importar PDF
                  </button>
                </div>
              )}
            </div>

            {/* ── MODO DE PREPARO & FOTO ── */}
            <div style={{ borderTop: '2px solid var(--cor-borda)', paddingTop: '20px', marginTop: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>📸 Apresentação & Modo de Preparo</div>

              {/* Foto */}
              <div style={{ display: 'grid', gridTemplateColumns: selecionado.foto_url ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
                {selecionado.foto_url && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase' }}>Foto atual</div>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Remover a foto deste produto?')) return
                          await supabase.from('produtos').update({ foto_url: null }).eq('id', selecionado.id)
                          setSelecionado(prev => ({ ...prev, foto_url: null }))
                        }}
                        className="badge-perigo"
                        style={{ border: 'none', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        🗑️ Remover
                      </button>
                    </div>
                    {/* Enquadramento fixo 16:9 com object-fit: cover */}
                    <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--cor-borda)' }}>
                      <img
                        src={selecionado.foto_url} alt={selecionado.nome}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto-suave)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {selecionado.foto_url ? 'Trocar foto' : 'Adicionar foto do prato'}
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '32px 16px', border: '2px dashed var(--cor-borda)', borderRadius: '10px',
                    cursor: 'pointer', color: 'var(--cor-texto-suave)', fontSize: '0.9rem',
                    background: 'var(--cor-fundo)', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cor-primaria)'; e.currentTarget.style.color = 'var(--cor-primaria)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.color = 'var(--cor-texto-suave)' }}
                  >
                    {uploadingFoto ? '⏳ Enviando...' : '📷 Clique para escolher uma foto'}
                    <input type="file" accept="image/*" onChange={uploadFoto} style={{ display: 'none' }} disabled={uploadingFoto} />
                  </label>
                </div>
              </div>

              {/* Modo de preparo */}
              <div className="campo-grupo">
                <label>📝 Modo de preparo / Observações</label>
                <textarea
                  value={modoPreparoTexto}
                  onChange={e => setModoPreparoTexto(e.target.value)}
                  placeholder="Descreva o passo a passo do preparo, temperatura, tempo de cozimento, técnicas utilizadas..."
                  rows={5}
                  style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                />
                <span className="ajuda">Visível para os operadores como guia de preparo.</span>
              </div>
              <button
                className="btn btn-primario"
                onClick={salvarModoPreparo}
                disabled={salvandoPreparo}
                style={{ width: '100%' }}
              >
                {salvandoPreparo ? '⏳ Salvando...' : '💾 Salvar modo de preparo'}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Modal de impressão da ficha técnica */}
      {printAberto && selecionado && (
        <FichaTecnicaPrint
          produto={selecionado}
          ficha={ficha}
          onFechar={() => setPrintAberto(false)}
        />
      )}

      {/* Modal de importação via PDF */}
      {pdfModalAberto && selecionado && (
        <ImportarReceitaPDF
          produto={selecionado}
          insumos={insumos}
          onSalvar={salvarReceitaPDF}
          onFechar={() => setPdfModalAberto(false)}
        />
      )}
    </div>
  )
}

/* =====================================================
   INSUMOS com busca, categorias, edição e histórico
   ===================================================== */
function CadastroInsumos() {
  const empresaId = useEmpresaId()
  const [insumos, setInsumos] = useState([])
  const [historico, setHistorico] = useState([])

  const [nome, setNome]         = useState('')
  const [preco, setPreco]       = useState('')
  const [unidade, setUnidade]   = useState('kg')
  const [categoria, setCategoria] = useState('Outros')

  const [busca, setBusca]               = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [verHistoricoId, setVerHistoricoId]   = useState(null)

  const [editandoId, setEditandoId]       = useState(null)
  const [editNome, setEditNome]           = useState('')
  const [editPreco, setEditPreco]         = useState('')
  const [editUnidade, setEditUnidade]     = useState('kg')
  const [editCategoria, setEditCategoria] = useState('Outros')

  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro]         = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const [{ data: ins }, { data: hist }] = await Promise.all([
      supabase.from('insumos').select('*').order('categoria').order('nome'),
      supabase.from('historico_precos_insumos').select('*').order('created_at', { ascending: false }),
    ])
    setInsumos(ins || [])
    setHistorico(hist || [])
  }

  async function salvar(e) {
    e.preventDefault()
    setErro(''); setMensagem('')
    if (!empresaId) { setErro('Empresa não encontrada. Faça logout e entre novamente.'); return }
    setSalvando(true)
    const { error } = await supabase.from('insumos').insert({
      empresa_id: empresaId, nome, preco_por_kg: parseFloat(preco) || 0, unidade_padrao: unidade, categoria,
    })
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setMensagem('Insumo cadastrado!')
    setNome(''); setPreco(''); setUnidade('kg'); setCategoria('Outros')
    carregar()
    setTimeout(() => setMensagem(''), 3000)
  }

  function iniciarEdicao(insumo) {
    setEditandoId(insumo.id); setEditNome(insumo.nome)
    setEditPreco(insumo.preco_por_kg); setEditUnidade(insumo.unidade_padrao)
    setEditCategoria(insumo.categoria || 'Outros')
  }

  async function salvarEdicao(insumo) {
    const precoNovo = parseFloat(editPreco) || 0
    // Grava histórico se o preço mudou
    if (precoNovo !== parseFloat(insumo.preco_por_kg)) {
      await supabase.from('historico_precos_insumos').insert({
        insumo_id: insumo.id, preco_anterior: insumo.preco_por_kg, preco_novo: precoNovo,
      })
    }
    const { error } = await supabase.from('insumos').update({
      nome: editNome, preco_por_kg: precoNovo, unidade_padrao: editUnidade, categoria: editCategoria,
    }).eq('id', insumo.id)
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setEditandoId(null); carregar()
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este insumo? Ele será removido das fichas técnicas e do histórico de preços também.')) return
    // Remove vínculos primeiro (FK constraints)
    await supabase.from('produto_ingredientes').delete().eq('insumo_id', id)
    await supabase.from('producao_ingredientes').delete().eq('insumo_id', id)
    await supabase.from('historico_precos_insumos').delete().eq('insumo_id', id)
    const { error } = await supabase.from('insumos').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    carregar()
  }

  const insumosFiltrados = insumos.filter(i => {
    const bOk = i.nome.toLowerCase().includes(busca.toLowerCase())
    const cOk = filtroCategoria === 'Todas' || i.categoria === filtroCategoria
    return bOk && cOk
  })

  const porCategoria = insumosFiltrados.reduce((acc, i) => {
    const cat = i.categoria || 'Outros'
    if (!acc[cat]) acc[cat] = []; acc[cat].push(i); return acc
  }, {})

  return (
    <div className="cadastros-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
      <div className="card">
        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Novo insumo</h3>
        {erro && <div className="mensagem-erro">{erro}</div>}
        {mensagem && <div className="mensagem-sucesso">{mensagem}</div>}
        <form onSubmit={salvar}>
          <div className="campo-grupo">
            <label>Categoria</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}>
              {CATEGORIAS_INSUMO.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="campo-grupo">
            <label>Nome do insumo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Patinho bovino" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="campo-grupo">
              <label>Preço por kg (R$)</label>
              <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0.00" />
            </div>
            <div className="campo-grupo">
              <label>Unidade</label>
              <select value={unidade} onChange={e => setUnidade(e.target.value)}>
                <option value="kg">kg</option><option value="g">g</option>
                <option value="L">L</option><option value="ml">ml</option><option value="un">unidade</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primario" type="submit" disabled={salvando} style={{ width: '100%' }}>
            {salvando ? 'Salvando...' : 'Cadastrar insumo'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cor-texto-suave)' }}>🔍</span>
            <input placeholder="Buscar insumo..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ paddingLeft: '36px', width: '100%', padding: '10px 12px 10px 36px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
            style={{ padding: '10px 12px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'inherit', background: 'var(--cor-fundo-card)', color: 'var(--cor-texto)' }}>
            {['Todas', ...CATEGORIAS_INSUMO].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)', marginBottom: '12px' }}>
          {insumosFiltrados.length} insumo(s) encontrado(s)
        </div>

        {insumosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--cor-texto-suave)' }}>
            {busca ? `Nenhum insumo para "${busca}"` : 'Nenhum insumo cadastrado ainda.'}
          </div>
        )}

        {Object.entries(porCategoria).map(([cat, lista]) => (
          <div key={cat} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: COR_CAT[cat] || '#f1f5f9', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {cat}
            </div>
            {lista.map(insumo => {
              const histInsumo = historico.filter(h => h.insumo_id === insumo.id)
              return (
                <div key={insumo.id} style={{ marginBottom: '6px' }}>
                  {editandoId !== insumo.id ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo-card)' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600 }}>{insumo.nome}</span>
                          <SemRevisao historico={historico.filter(h => h.insumo_id === insumo.id)} />
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '100px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--cor-primaria)' }}>R$ {parseFloat(insumo.preco_por_kg).toFixed(2)}</span>
                          <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.8rem' }}>/{insumo.unidade_padrao}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '10px' }}>
                          {histInsumo.length > 0 && (
                            <button onClick={() => setVerHistoricoId(verHistoricoId === insumo.id ? null : insumo.id)}
                              style={{ background: 'var(--cor-fundo)', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}
                              title="Ver histórico de preços">📈</button>
                          )}
                          <button onClick={() => iniciarEdicao(insumo)}
                            style={{ background: 'var(--cor-fundo)', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '5px 10px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto-suave)' }}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => excluir(insumo.id)}
                            style={{ background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', fontSize: '0.8rem', color: 'var(--cor-perigo)' }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                      {/* Histórico de preços expandido */}
                      {verHistoricoId === insumo.id && (
                        <div style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: '0 0 8px 8px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cor-texto-suave)', marginBottom: '6px', textTransform: 'uppercase' }}>Histórico de preços</div>
                          {histInsumo.map(h => (
                            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '3px 0', borderBottom: '1px solid var(--cor-borda)' }}>
                              <span style={{ color: 'var(--cor-texto-suave)' }}>{new Date(h.created_at).toLocaleDateString('pt-BR')}</span>
                              <span>
                                <span style={{ color: '#94a3b8', textDecoration: 'line-through', marginRight: '6px' }}>R$ {parseFloat(h.preco_anterior || 0).toFixed(2)}</span>
                                <span style={{ fontWeight: 700, color: parseFloat(h.preco_novo) > parseFloat(h.preco_anterior) ? 'var(--cor-perigo)' : 'var(--cor-sucesso)' }}>
                                  R$ {parseFloat(h.preco_novo).toFixed(2)}
                                  {parseFloat(h.preco_novo) > parseFloat(h.preco_anterior) ? ' ▲' : ' ▼'}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '14px', borderRadius: '8px', border: '2px solid var(--cor-primaria)', background: 'rgba(249,115,22,0.07)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div className="campo-grupo" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.8rem' }}>Nome</label>
                          <input value={editNome} onChange={e => setEditNome(e.target.value)} />
                        </div>
                        <div className="campo-grupo" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.8rem' }}>Categoria</label>
                          <select value={editCategoria} onChange={e => setEditCategoria(e.target.value)}>
                            {CATEGORIAS_INSUMO.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="campo-grupo" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.8rem' }}>Preço por kg (R$)</label>
                          <input type="number" step="0.01" value={editPreco} onChange={e => setEditPreco(e.target.value)} />
                        </div>
                        <div className="campo-grupo" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.8rem' }}>Unidade</label>
                          <select value={editUnidade} onChange={e => setEditUnidade(e.target.value)}>
                            <option value="kg">kg</option><option value="g">g</option>
                            <option value="L">L</option><option value="ml">ml</option><option value="un">unidade</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primario" onClick={() => salvarEdicao(insumo)} style={{ flex: 1, padding: '8px' }}>✓ Salvar</button>
                        <button className="btn btn-secundario" onClick={() => setEditandoId(null)} style={{ padding: '8px 14px' }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* =====================================================
   FORNECEDORES
   ===================================================== */
function CadastroFornecedores() {
  const empresaId = useEmpresaId()
  const [fornecedores, setFornecedores] = useState([])
  const [nome, setNome] = useState(''); const [contato, setContato] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState(''); const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('fornecedores').select('*').order('aprovado', { ascending: true }).order('nome')
    setFornecedores(data || [])
  }

  async function aprovar(id) {
    await supabase.from('fornecedores').update({ aprovado: true }).eq('id', id)
    carregar()
  }

  async function excluirForn(id) {
    if (!window.confirm('Excluir este fornecedor?')) return
    await supabase.from('fornecedores').delete().eq('id', id)
    carregar()
  }

  async function salvar(e) {
    e.preventDefault(); setErro(''); setMensagem('')
    if (!empresaId) { setErro('Empresa não encontrada.'); return }
    setSalvando(true)
    const { error } = await supabase.from('fornecedores').insert({ empresa_id: empresaId, nome, contato })
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setMensagem('Fornecedor cadastrado!'); setNome(''); setContato('')
    carregar(); setTimeout(() => setMensagem(''), 3000)
  }

  return (
    <div className="cadastros-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
      <div className="card">
        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Novo fornecedor</h3>
        {erro && <div className="mensagem-erro">{erro}</div>}
        {mensagem && <div className="mensagem-sucesso">{mensagem}</div>}
        <form onSubmit={salvar}>
          <div className="campo-grupo">
            <label>Nome do fornecedor</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Frigorífico São João" required />
          </div>
          <div className="campo-grupo">
            <label>Contato (telefone ou e-mail)</label>
            <input value={contato} onChange={e => setContato(e.target.value)} placeholder="Ex: (11) 99999-0000" />
          </div>
          <button className="btn btn-primario" type="submit" disabled={salvando} style={{ width: '100%' }}>
            {salvando ? 'Salvando...' : 'Cadastrar fornecedor'}
          </button>
        </form>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Fornecedores cadastrados</h3>
        <div className="tabela-container">
          <table>
            <thead><tr><th>Nome</th><th>Contato</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {fornecedores.map(f => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.nome}</div>
                    {f.aprovado === false && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--cor-atencao)', background: 'rgba(245,158,11,0.12)', display: 'inline-block', padding: '1px 8px', borderRadius: '10px', marginTop: '2px' }}>
                        ⏳ Aguardando aprovação
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--cor-texto-suave)' }}>{f.contato || '—'}</td>
                  <td>
                    {f.aprovado === false ? (
                      <button onClick={() => aprovar(f.id)} className="badge-sucesso" style={{ border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                        ✓ Aprovar
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--cor-sucesso)', fontWeight: 600 }}>✓ Aprovado</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => excluirForn(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--cor-perigo)'}
                      onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {fornecedores.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--cor-texto-suave)' }}>Nenhum fornecedor ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
