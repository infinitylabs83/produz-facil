import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import FichaTecnicaPrint from '../components/FichaTecnicaPrint'
import ImportarReceitaPDF from '../components/ImportarReceitaPDF'

const ABAS = ['Produtos & Fichas', 'Insumos', 'Fornecedores']

const CATEGORIAS_PRODUTO = ['Carnes', 'Aves', 'Peixes', 'Molhos', 'Guarnições', 'Sobremesas', 'Massas', 'Outros']
const CATEGORIAS_INSUMO_PADRAO = ['Carnes e Aves', 'Peixes e Frutos do Mar', 'Laticínios e Ovos', 'Hortifruti', 'Temperos e Condimentos', 'Óleos e Gorduras', 'Grãos e Cereais', 'Molhos e Caldos', 'Bebidas', 'Embalagens', 'Outros']

// Retorna itens da lista com nome parecido com o digitado
function encontrarSimilares(nomeNovo, lista, chave = 'nome') {
  const n = nomeNovo.trim().toLowerCase()
  if (n.length < 3) return []
  return lista.filter(item => {
    const e = item[chave].toLowerCase()
    return e === n || e.includes(n) || n.includes(e)
  })
}

function useCatsInsumo() {
  const KEY = 'cats_insumo_v1'
  const [cats, setCats] = useState(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : CATEGORIAS_INSUMO_PADRAO } catch { return CATEGORIAS_INSUMO_PADRAO }
  })
  function salvar(nova) { setCats(nova); localStorage.setItem(KEY, JSON.stringify(nova)) }
  function adicionar(nome) { if (!nome.trim() || cats.includes(nome.trim())) return; salvar([...cats, nome.trim()]) }
  function renomear(antiga, nova) {
    if (!nova.trim() || cats.includes(nova.trim())) return
    salvar(cats.map(c => c === antiga ? nova.trim() : c))
  }
  function remover(cat) { salvar(cats.filter(c => c !== cat)) }
  return { cats, adicionar, renomear, remover }
}

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
  const [filtroCat, setFiltroCat] = useState('Todas')

  // campos do formulário de produto
  const [fNome, setFNome]         = useState('')
  const [fPorcao, setFPorcao]     = useState('')
  const [fMeta, setFMeta]         = useState('')
  const [fCategoria, setFCategoria] = useState('Outros')

  // ficha técnica do produto selecionado
  const [ficha, setFicha]           = useState([])
  const [adicionandoIng, setAdicionandoIng] = useState(false)
  const [ingInsumoId, setIngInsumoId]   = useState('')
  const [buscaIng, setBuscaIng] = useState('')
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

  // sub-ficha: uma linha da ficha pode ser um insumo comprado OU outro produto
  // de fabricação (FAB), que tem ficha e custo/kg próprios.
  const [todasLinhasFicha, setTodasLinhasFicha] = useState([])
  const [ingTipo, setIngTipo]           = useState('insumo') // 'insumo' | 'produto'
  const [ingProdutoRefId, setIngProdutoRefId] = useState('')

  // carrega dados iniciais
  useEffect(() => {
    carregarProdutos()
    supabase.from('insumos').select('id, nome, preco_por_kg, unidade_padrao').order('nome')
      .then(({ data }) => setInsumos(data || []))
    carregarTodasLinhasFicha()
  }, [])

  // Todas as linhas de ficha da empresa. Necessário porque uma ficha pode usar
  // outra ficha (sub-ficha FAB), e o custo/kg dela só sai resolvendo a árvore
  // inteira — não dá pra calcular olhando só a ficha aberta na tela.
  async function carregarTodasLinhasFicha() {
    const { data } = await supabase
      .from('produto_ingredientes')
      .select('produto_id, insumo_id, produto_ref_id, quantidade_padrao, unidade_uso')
    setTodasLinhasFicha(data || [])
  }

  async function carregarProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('categoria').order('nome')
    setProdutos(data || [])
  }

  async function carregarFicha(prodId) {
    const { data } = await supabase
      .from('produto_ingredientes')
      .select('id, quantidade_padrao, unidade_uso, insumo_id, produto_ref_id, insumos(id, nome, preco_por_kg, unidade_padrao), produto_ref:produtos!produto_ref_id(id, nome, rendimento_kg, porcao_padrao_g)')
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

    if (modo === 'novo') {
      const similares = encontrarSimilares(fNome, produtos)
      if (similares.length > 0) {
        const nomes = similares.map(p => `"${p.nome}"`).join(', ')
        const ok = window.confirm(`⚠️ Já existe um produto com nome parecido: ${nomes}.\n\nDeseja criar "${fNome.trim()}" mesmo assim?`)
        if (!ok) return
      }
    }

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

  // ── Duplicar ficha técnica ──
  const [duplicandoId, setDuplicandoId] = useState(null) // id do produto sendo duplicado
  const [nomedup, setNomeDup] = useState('')
  const [duplicando, setDuplicando] = useState(false)

  function abrirDuplicar(p) {
    setDuplicandoId(p.id)
    setNomeDup(p.nome + ' (cópia)')
  }

  async function confirmarDuplicar() {
    if (!nomedup.trim() || !empresaId) return
    setDuplicando(true)
    // Busca produto original
    const original = produtos.find(p => p.id === duplicandoId)
    // Cria novo produto com os mesmos dados
    const { data: novo, error } = await supabase.from('produtos').insert({
      empresa_id: empresaId,
      nome: nomedup.trim(),
      porcao_padrao_g: original.porcao_padrao_g,
      meta_rendimento: original.meta_rendimento,
      categoria: original.categoria,
    }).select().single()
    if (error) { setDuplicando(false); return }
    // Copia os ingredientes da ficha técnica
    const { data: ings } = await supabase.from('produto_ingredientes')
      .select('insumo_id, quantidade_padrao, unidade_uso')
      .eq('produto_id', duplicandoId)
    if (ings && ings.length > 0) {
      await supabase.from('produto_ingredientes').insert(
        ings.map(i => ({ produto_id: novo.id, insumo_id: i.insumo_id, quantidade_padrao: i.quantidade_padrao, unidade_uso: i.unidade_uso }))
      )
    }
    setDuplicando(false)
    setDuplicandoId(null)
    setNomeDup('')
    await carregarProdutos()
    selecionarProduto(novo)
    setMsg('Ficha duplicada! Edite o que precisar.')
    setTimeout(() => setMsg(''), 4000)
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
    carregarTodasLinhasFicha() // custo/kg de quem usa esta ficha depende disso
  }

  // ── Ficha técnica ──
  function selecionarInsumoFicha(id) {
    setIngInsumoId(id)
    const ins = insumos.find(i => i.id === id)
    if (ins) setIngUnidade(ins.unidade_padrao)
  }

  // Impede ciclo: se o produto que estou adicionando já usa (direta ou
  // indiretamente) a ficha aberta, aceitar criaria uma receita infinita.
  function criariaCiclo(produtoRefId, produtoAtualId) {
    if (produtoRefId === produtoAtualId) return true
    const linhasPorProduto = new Map()
    for (const l of todasLinhasFicha) {
      if (!linhasPorProduto.has(l.produto_id)) linhasPorProduto.set(l.produto_id, [])
      linhasPorProduto.get(l.produto_id).push(l)
    }
    const vistos = new Set()
    const usa = (id) => {
      if (id === produtoAtualId) return true
      if (vistos.has(id)) return false
      vistos.add(id)
      return (linhasPorProduto.get(id) || [])
        .some(l => l.produto_ref_id && usa(l.produto_ref_id))
    }
    return usa(produtoRefId)
  }

  async function adicionarIngrediente(e) {
    e.preventDefault()
    setErro('')
    const usandoProduto = ingTipo === 'produto'

    if (usandoProduto) {
      if (!ingProdutoRefId) { setErro('Selecione o produto de fabricação.'); return }
      if (ficha.some(f => f.produto_ref_id === ingProdutoRefId)) { setErro('Este produto já está na ficha.'); return }
      if (criariaCiclo(ingProdutoRefId, selecionado.id)) {
        setErro('Não dá: esse produto já usa esta ficha, direta ou indiretamente — criaria uma receita circular.')
        return
      }
    } else {
      if (!ingInsumoId) { setErro('Selecione um insumo.'); return }
      if (ficha.some(f => f.insumo_id === ingInsumoId)) { setErro('Este insumo já está na ficha.'); return }
    }

    const { error } = await supabase.from('produto_ingredientes').insert({
      produto_id: selecionado.id,
      insumo_id: usandoProduto ? null : ingInsumoId,
      produto_ref_id: usandoProduto ? ingProdutoRefId : null,
      quantidade_padrao: parseFloat(ingQtd) || null, unidade_uso: ingUnidade,
    })
    if (error) { setErro('Erro: ' + error.message); return }
    setIngInsumoId(''); setIngProdutoRefId(''); setIngQtd(''); setIngUnidade('kg'); setIngTipo('insumo')
    setAdicionandoIng(false)
    carregarFicha(selecionado.id)
    carregarTodasLinhasFicha()
  }

  async function removerIngrediente(id) {
    if (!window.confirm('Remover este ingrediente da ficha?')) return
    await supabase.from('produto_ingredientes').delete().eq('id', id)
    carregarFicha(selecionado.id)
    carregarTodasLinhasFicha()
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

  const emKg = (qtd, unidade) => (unidade === 'g' ? (qtd || 0) / 1000 : (qtd || 0))

  // Rendimento da receita inteira, em kg. É o divisor que fecha o custo/kg:
  //   custo/kg = custo total dos insumos / rendimento
  //   (ex.: ROSBIFE - FAB: R$ 789,31 / 10,8 kg = R$ 73,08/kg)
  // Usa `rendimento_kg` quando existe (vem da ficha do DRE). Sem ele, cai no
  // comportamento antigo: peso dos ingredientes x meta_rendimento%.
  function rendimentoDe(produto, pesoIngredientes) {
    const r = Number(produto?.rendimento_kg)
    if (r > 0) return r
    return pesoIngredientes * ((Number(produto?.meta_rendimento) || 100) / 100)
  }

  // Custo por kg de CADA produto, resolvendo sub-fichas recursivamente:
  // uma ficha que usa "FRANGO CHAPEADO - FAB" precisa do custo/kg dele, que por
  // sua vez sai da ficha dele. Memoiza e corta ciclo (A usa B, B usa A).
  const custoPorKgPorProduto = useMemo(() => {
    const precoInsumo = new Map(insumos.map(i => [i.id, Number(i.preco_por_kg) || 0]))
    const produtoById = new Map(produtos.map(p => [p.id, p]))
    const linhasPorProduto = new Map()
    for (const l of todasLinhasFicha) {
      if (!linhasPorProduto.has(l.produto_id)) linhasPorProduto.set(l.produto_id, [])
      linhasPorProduto.get(l.produto_id).push(l)
    }
    const memo = new Map()
    const visitando = new Set()
    function custoKg(produtoId) {
      if (memo.has(produtoId)) return memo.get(produtoId)
      if (visitando.has(produtoId)) return 0 // ciclo: corta pra não travar a tela
      visitando.add(produtoId)
      let custo = 0, peso = 0
      for (const l of linhasPorProduto.get(produtoId) || []) {
        const qKg = emKg(Number(l.quantidade_padrao), l.unidade_uso)
        peso += qKg
        custo += qKg * (l.produto_ref_id ? custoKg(l.produto_ref_id) : (precoInsumo.get(l.insumo_id) || 0))
      }
      const rend = rendimentoDe(produtoById.get(produtoId), peso)
      const valor = rend > 0 ? custo / rend : 0
      visitando.delete(produtoId)
      memo.set(produtoId, valor)
      return valor
    }
    const out = new Map()
    for (const p of produtos) out.set(p.id, custoKg(p.id))
    return out
  }, [insumos, produtos, todasLinhasFicha])

  // Custo/kg de uma linha da ficha: preço do insumo, ou custo/kg da sub-ficha.
  const custoUnitarioDaLinha = (f) =>
    f.produto_ref_id
      ? (custoPorKgPorProduto.get(f.produto_ref_id) || 0)
      : Number(f.insumos?.preco_por_kg || 0)

  // Custo total de todos os ingredientes (insumos + sub-fichas)
  const custoFicha = ficha.reduce(
    (acc, f) => acc + emKg(f.quantidade_padrao, f.unidade_uso) * custoUnitarioDaLinha(f), 0)

  // Peso total de todos os ingredientes (em kg)
  const pesoTotalReceita = ficha.reduce(
    (acc, f) => acc + emKg(f.quantidade_padrao, f.unidade_uso), 0)

  const rendimentoFicha = rendimentoDe(selecionado, pesoTotalReceita)
  const custoPorKgFicha = rendimentoFicha > 0 ? custoFicha / rendimentoFicha : 0

  // Custo da porção = custo/kg * porção em kg (informativo)
  const custoPorcaoFicha = custoPorKgFicha * ((selecionado?.porcao_padrao_g || 0) / 1000)

  const insumosDisponiveis = insumos.filter(i => !ficha.some(f => f.insumo_id === i.id))

  // Produtos que podem entrar como sub-ficha: exclui o próprio, os que já estão
  // na ficha e os que criariam receita circular. Itens FAB aparecem primeiro,
  // que é o caso de uso normal (molho, proteína chapeada, etc.).
  const produtosDisponiveis = !selecionado ? [] : produtos
    .filter(p => p.id !== selecionado.id)
    .filter(p => !ficha.some(f => f.produto_ref_id === p.id))
    .filter(p => !criariaCiclo(p.id, selecionado.id))
    .sort((a, b) => {
      const fa = /FAB/i.test(a.nome) ? 0 : 1
      const fb = /FAB/i.test(b.nome) ? 0 : 1
      return fa - fb || a.nome.localeCompare(b.nome, 'pt-BR')
    })

  // filtra por busca e agrupa por categoria (itens FAB vão para "Fabricação")
  const ORDEM_CAT = ['Fabricação', 'Carnes', 'Aves', 'Peixes', 'Molhos', 'Guarnições', 'Sobremesas', 'Massas', 'Adicional', 'Outros']

  const produtosFiltrados = produtos.filter(p => {
    const cat = p.nome.toUpperCase().includes('FAB') ? 'Fabricação' : (p.categoria || 'Outros')
    const bOk = p.nome.toLowerCase().includes(busca.toLowerCase())
    const cOk = filtroCat === 'Todas' || cat === filtroCat
    return bOk && cOk
  })

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

      {/* Modal de duplicar ficha */}
      {duplicandoId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{ background: 'var(--cor-fundo-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>📋</div>
            <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '6px' }}>Duplicar ficha técnica</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--cor-texto-suave)', marginBottom: '20px' }}>
              Todos os ingredientes serão copiados. Depois é só renomear e ajustar o que precisar.
            </p>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Nome do novo produto
            </label>
            <input
              value={nomedup}
              onChange={e => setNomeDup(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmarDuplicar()}
              autoFocus
              style={{ width: '100%', padding: '12px 14px', fontSize: '1rem', fontWeight: 600, border: '2px solid var(--cor-primaria)', borderRadius: '10px', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', boxSizing: 'border-box', outline: 'none', marginBottom: '18px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setDuplicandoId(null); setNomeDup('') }} style={{
                flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid var(--cor-borda)',
                background: 'transparent', color: 'var(--cor-texto)', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
              }}>
                Cancelar
              </button>
              <button onClick={confirmarDuplicar} disabled={duplicando || !nomedup.trim()} style={{
                flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                background: 'var(--cor-primaria)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              }}>
                {duplicando ? 'Duplicando...' : '✅ Duplicar e abrir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAINEL ESQUERDO — lista de produtos */}
      <div>
        <button className="btn btn-primario" onClick={iniciarNovo} style={{ width: '100%', marginBottom: '10px' }}>
          ＋ Novo Produto
        </button>

        {/* Campo de busca + filtro de categoria */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
          <select
            value={filtroCat}
            onChange={e => setFiltroCat(e.target.value)}
            style={{ padding: '9px 8px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'inherit', background: 'var(--cor-fundo-card)', color: 'var(--cor-texto)', cursor: 'pointer', flexShrink: 0 }}
          >
            {['Todas', ...ORDEM_CAT].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {(busca || filtroCat !== 'Todas') && (
          <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginBottom: '8px' }}>
            {produtosFiltrados.length} resultado(s){busca ? ` para "${busca}"` : ''}
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
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => selecionarProduto(p)} style={{
                    flex: 1, padding: '12px 14px', borderRadius: '10px', border: '2px solid',
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
                  <button onClick={e => { e.stopPropagation(); abrirDuplicar(p) }} title="Duplicar ficha" style={{
                    padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)',
                    background: 'rgba(59,130,246,0.06)', color: 'var(--cor-info)',
                    cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0,
                  }}>
                    📋
                  </button>
                  <button onClick={async (e) => {
                    e.stopPropagation()
                    if (!window.confirm(`Excluir "${p.nome}"?`)) return
                    await supabase.from('produto_ingredientes').delete().eq('produto_id', p.id)
                    await supabase.from('produtos').delete().eq('id', p.id)
                    if (selecionado?.id === p.id) { setSelecionado(null); setFicha([]) }
                    carregarProdutos()
                  }} title="Excluir produto" style={{
                    padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.06)', color: 'var(--cor-perigo)',
                    cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0,
                  }}>
                    🗑️
                  </button>
                </div>
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
                const qKg = emKg(q, f.unidade_uso)
                const ehSubFicha = !!f.produto_ref_id
                const precoUnit = custoUnitarioDaLinha(f)
                const custo = qKg * precoUnit
                const nomeLinha = ehSubFicha ? f.produto_ref?.nome : f.insumos?.nome
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
                            background: ehSubFicha ? '#3b82f6' : 'var(--cor-primaria)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.75rem',
                          }}>{idx + 1}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {nomeLinha}
                              {ehSubFicha && (
                                <span style={{
                                  marginLeft: '8px', fontSize: '0.65rem', fontWeight: 700,
                                  background: '#dbeafe', color: '#1d4ed8',
                                  padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
                                }}>ficha própria</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>
                              R$ {precoUnit.toFixed(2)}/kg
                              {ehSubFicha && ' · custo calculado da ficha dele'}
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
                    {/* A linha da ficha pode ser um insumo comprado OU outra ficha (ex.: FAB) */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                      {[
                        { v: 'insumo', txt: '🧂 Insumo', hint: 'algo que você compra' },
                        { v: 'produto', txt: '🏭 Produto de fabricação', hint: 'outra ficha, ex.: FAB' },
                      ].map(op => (
                        <button
                          key={op.v}
                          type="button"
                          onClick={() => { setIngTipo(op.v); setErro('') }}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.3,
                            border: ingTipo === op.v ? '2px solid #3b82f6' : '2px solid var(--cor-borda)',
                            background: ingTipo === op.v ? '#dbeafe' : 'var(--cor-fundo)',
                            color: ingTipo === op.v ? '#1d4ed8' : 'var(--cor-texto-suave)',
                          }}
                        >
                          {op.txt}
                          <div style={{ fontWeight: 500, fontSize: '0.68rem', opacity: 0.85 }}>{op.hint}</div>
                        </button>
                      ))}
                    </div>

                    {ingTipo === 'insumo' && (
                    <div className="campo-grupo">
                      <label>Insumo</label>
                      <div style={{ position: 'relative', marginBottom: '6px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cor-texto-suave)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                        <input
                          type="text"
                          placeholder="Pesquisar insumo..."
                          value={buscaIng}
                          onChange={e => setBuscaIng(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px 8px 32px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.88rem', fontFamily: 'inherit', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', boxSizing: 'border-box' }}
                        />
                      </div>
                      <select value={ingInsumoId} onChange={e => selecionarInsumoFicha(e.target.value)} required size={Math.min(8, insumosDisponiveis.filter(i => !buscaIng || i.nome.toLowerCase().includes(buscaIng.toLowerCase())).length + 1)} style={{ width: '100%', borderRadius: '8px', border: '2px solid var(--cor-borda)', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '0.88rem', fontFamily: 'inherit' }}>
                        <option value="">— selecione —</option>
                        {insumosDisponiveis
                          .filter(i => !buscaIng || i.nome.toLowerCase().includes(buscaIng.toLowerCase()))
                          .map(i => (
                            <option key={i.id} value={i.id}>
                              {i.nome} · R$ {parseFloat(i.preco_por_kg).toFixed(2)}/{i.unidade_padrao}
                            </option>
                          ))}
                      </select>
                      {insumos.length === 0 && <span className="ajuda">Cadastre insumos na aba <strong>Insumos</strong> primeiro.</span>}
                    </div>
                    )}

                    {ingTipo === 'produto' && (
                    <div className="campo-grupo">
                      <label>Produto de fabricação</label>
                      <div style={{ position: 'relative', marginBottom: '6px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cor-texto-suave)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                        <input
                          type="text"
                          placeholder="Pesquisar produto..."
                          value={buscaIng}
                          onChange={e => setBuscaIng(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px 8px 32px', border: '2px solid var(--cor-borda)', borderRadius: '8px', fontSize: '0.88rem', fontFamily: 'inherit', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', boxSizing: 'border-box' }}
                        />
                      </div>
                      <select
                        value={ingProdutoRefId}
                        onChange={e => setIngProdutoRefId(e.target.value)}
                        required
                        size={Math.min(8, produtosDisponiveis.filter(p => !buscaIng || p.nome.toLowerCase().includes(buscaIng.toLowerCase())).length + 1)}
                        style={{ width: '100%', borderRadius: '8px', border: '2px solid var(--cor-borda)', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                      >
                        <option value="">— selecione —</option>
                        {produtosDisponiveis
                          .filter(p => !buscaIng || p.nome.toLowerCase().includes(buscaIng.toLowerCase()))
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nome} · R$ {(custoPorKgPorProduto.get(p.id) || 0).toFixed(2)}/kg
                            </option>
                          ))}
                      </select>
                      <span className="ajuda">
                        O custo entra pelo <strong>custo/kg calculado na ficha dele</strong> — se o preço de um insumo lá mudar, esta ficha acompanha sozinha.
                      </span>
                    </div>
                    )}
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
                      <button type="button" className="btn btn-secundario" onClick={() => { setAdicionandoIng(false); setErro(''); setBuscaIng('') }} style={{ padding: '10px 16px' }}>Cancelar</button>
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
  const { cats: CATEGORIAS_INSUMO, adicionar: addCat, renomear: renameCat, remover: removeCat } = useCatsInsumo()
  const [insumos, setInsumos] = useState([])
  const [historico, setHistorico] = useState([])

  const [nome, setNome]         = useState('')
  const [preco, setPreco]       = useState('')
  const [unidade, setUnidade]   = useState('kg')
  const [categoria, setCategoria] = useState('Outros')

  const [busca, setBusca]               = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todos')
  const [verHistoricoId, setVerHistoricoId]   = useState(null)

  const [editandoId, setEditandoId]       = useState(null)
  const [editNome, setEditNome]           = useState('')
  const [editPreco, setEditPreco]         = useState('')
  const [editUnidade, setEditUnidade]     = useState('kg')
  const [editCategoria, setEditCategoria] = useState('Outros')

  // Gerenciador de categorias
  const [gerenciarCats, setGerenciarCats] = useState(false)
  const [novaCat, setNovaCat] = useState('')
  const [renomCat, setRenomCat] = useState({}) // { [cat]: novoNome }

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

    // Aviso de nome similar
    const similares = encontrarSimilares(nome, insumos)
    if (similares.length > 0) {
      const nomes = similares.map(i => `"${i.nome}"`).join(', ')
      const ok = window.confirm(`⚠️ Já existe um insumo com nome parecido: ${nomes}.\n\nDeseja cadastrar "${nome.trim()}" mesmo assim?`)
      if (!ok) return
    }

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
    const cOk = filtroCategoria === 'Todos' || i.categoria === filtroCategoria
    return bOk && cOk
  })

  const porCategoria = insumosFiltrados.reduce((acc, i) => {
    const cat = i.categoria || 'Outros'
    if (!acc[cat]) acc[cat] = []; acc[cat].push(i); return acc
  }, {})

  return (
    <div className="cadastros-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

      {/* Modal de gerenciar categorias */}
      {gerenciarCats && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--cor-fundo-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>🏷️ Gerenciar categorias</h3>
              <button onClick={() => setGerenciarCats(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--cor-texto-suave)' }}>✕</button>
            </div>
            {/* Adicionar nova */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                value={novaCat}
                onChange={e => setNovaCat(e.target.value)}
                placeholder="Nome da nova categoria..."
                onKeyDown={e => { if (e.key === 'Enter') { addCat(novaCat); setNovaCat('') } }}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '2px solid var(--cor-primaria)', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '0.9rem' }}
              />
              <button onClick={() => { addCat(novaCat); setNovaCat('') }} style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--cor-primaria)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                + Adicionar
              </button>
            </div>
            {/* Lista de categorias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CATEGORIAS_INSUMO.map(cat => (
                <div key={cat} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo)' }}>
                  <input
                    value={renomCat[cat] !== undefined ? renomCat[cat] : cat}
                    onChange={e => setRenomCat(prev => ({ ...prev, [cat]: e.target.value }))}
                    onBlur={() => {
                      if (renomCat[cat] && renomCat[cat] !== cat) {
                        renameCat(cat, renomCat[cat])
                        setRenomCat(prev => { const n = { ...prev }; delete n[cat]; return n })
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && renomCat[cat] && renomCat[cat] !== cat) {
                        renameCat(cat, renomCat[cat])
                        setRenomCat(prev => { const n = { ...prev }; delete n[cat]; return n })
                      }
                    }}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo-card)', color: 'var(--cor-texto)', fontSize: '0.9rem' }}
                  />
                  <button onClick={() => {
                    if (!window.confirm(`Excluir categoria "${cat}"? Os insumos nessa categoria ficarão sem categoria.`)) return
                    removeCat(cat)
                  }} title="Excluir categoria" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: 'var(--cor-perigo)', cursor: 'pointer', fontSize: '0.9rem' }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '14px' }}>
              Para renomear: edite o campo e pressione Enter ou clique fora.
            </p>
          </div>
        </div>
      )}

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
            {['Todos', ...CATEGORIAS_INSUMO].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setGerenciarCats(true)} title="Gerenciar categorias" style={{ padding: '10px 12px', border: '2px solid var(--cor-borda)', borderRadius: '8px', background: 'var(--cor-fundo-card)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>
            🏷️
          </button>
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
            <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: COR_CAT[cat] || 'rgba(100,116,139,0.15)', color: 'var(--cor-texto)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
