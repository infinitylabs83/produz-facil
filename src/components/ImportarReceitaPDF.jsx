import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Aponta o worker para o arquivo incluído no pacote (Vite resolve automaticamente)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// Unidades de medida reconhecidas
const UNIDADES = ['kg', 'g', 'mg', 'l', 'ml', 'litro', 'litros', 'grama', 'gramas',
  'xícara', 'xícaras', 'colher', 'colheres', 'unidade', 'unidades', 'un', 'copo', 'copos',
  'dente', 'dentes', 'folha', 'folhas', 'pitada', 'pitadas', 'lata', 'latas', 'cx', 'caixa']

// Normaliza unidade para o padrão do sistema
function normalizarUnidade(u) {
  u = u.toLowerCase().replace(/\.$/,'')
  if (['g', 'grama', 'gramas'].includes(u)) return 'g'
  if (['kg', 'kilo', 'quilos'].includes(u)) return 'kg'
  if (['l', 'litro', 'litros'].includes(u)) return 'l'
  if (['ml'].includes(u)) return 'ml'
  return u
}

// Tenta extrair ingredientes de uma linha de texto
function parsearLinha(linha) {
  linha = linha.trim()
  if (!linha || linha.length < 4) return null

  // Padrões: "200g frango", "1 kg de arroz", "2 colheres de açúcar", "½ xícara leite"
  const regex = /^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*(kg|g|mg|ml|l|litros?|gramas?|xícaras?|colheres?|colher\s+de\s+\w+|unidades?|un|copos?|dentes?|folhas?|pitadas?|latas?|cx)\s+(?:de\s+)?(.+)/i
  const m = linha.match(regex)
  if (m) {
    const qtd = parseFloat(m[1].replace(',', '.'))
    const unidade = normalizarUnidade(m[2].split(' ')[0])
    const nome = m[3].trim().replace(/[,;.]+$/, '')
    if (nome.length > 1 && qtd > 0) return { qtd, unidade, nome, linhaOriginal: linha }
  }

  // Padrão reverso: "frango 200g"
  const regex2 = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|g|mg|ml|l|litros?|gramas?)$/i
  const m2 = linha.match(regex2)
  if (m2) {
    const nome = m2[1].trim()
    const qtd = parseFloat(m2[2].replace(',', '.'))
    const unidade = normalizarUnidade(m2[3])
    if (nome.length > 1 && qtd > 0) return { qtd, unidade, nome, linhaOriginal: linha }
  }

  return null
}

// Extrai texto de um PDF usando pdfjs
async function extrairTextoPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let texto = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    texto += content.items.map(item => item.str).join(' ') + '\n'
  }
  return texto
}

// Tenta encontrar um insumo pelo nome (busca simples por substring)
function matchInsumo(nome, insumos) {
  const n = nome.toLowerCase()
  return insumos.find(ins => ins.nome.toLowerCase().includes(n) || n.includes(ins.nome.toLowerCase())) || null
}

export default function ImportarReceitaPDF({ produto, insumos, onSalvar, onFechar }) {
  const [fase, setFase] = useState('upload')   // upload | processando | revisar | salvando | concluido
  const [erro, setErro] = useState('')
  const [ingredientes, setIngredientes] = useState([])  // { qtd, unidade, nome, insumoId, insumoNome }
  const [textoRaw, setTextoRaw] = useState('')
  const fileRef = useRef()

  async function processar(file) {
    if (!file || file.type !== 'application/pdf') {
      setErro('Selecione um arquivo PDF válido.')
      return
    }
    setErro('')
    setFase('processando')
    try {
      const texto = await extrairTextoPDF(file)
      setTextoRaw(texto)

      const linhas = texto.split(/[\n\r]+/)
      const encontrados = []
      for (const linha of linhas) {
        const ing = parsearLinha(linha)
        if (ing) {
          const match = matchInsumo(ing.nome, insumos)
          encontrados.push({
            ...ing,
            insumoId: match?.id || '',
            insumoNome: match?.nome || '',
          })
        }
      }

      if (encontrados.length === 0) {
        setErro('Não encontrei ingredientes com quantidade no PDF. Verifique se o PDF tem texto selecionável (não é imagem).')
        setFase('upload')
        return
      }

      setIngredientes(encontrados)
      setFase('revisar')
    } catch (e) {
      setErro('Erro ao ler o PDF: ' + e.message)
      setFase('upload')
    }
  }

  function atualizarIng(idx, campo, valor) {
    setIngredientes(prev => prev.map((i, n) => n === idx ? { ...i, [campo]: valor } : i))
  }

  function removerIng(idx) {
    setIngredientes(prev => prev.filter((_, n) => n !== idx))
  }

  async function salvar() {
    const validos = ingredientes.filter(i => i.insumoId && i.qtd > 0)
    if (validos.length === 0) {
      setErro('Associe pelo menos um ingrediente a um insumo cadastrado.')
      return
    }
    setFase('salvando')
    setErro('')
    try {
      await onSalvar(validos)
      setFase('concluido')
    } catch (e) {
      setErro('Erro ao salvar: ' + e.message)
      setFase('revisar')
    }
  }

  const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modal: { background: 'var(--cor-fundo-card)', border: '1px solid var(--cor-borda)', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    header: { padding: '20px 24px 16px', borderBottom: '1px solid var(--cor-borda)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
    footer: { padding: '16px 24px', borderTop: '1px solid var(--cor-borda)', display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    btn: (cor) => ({ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', background: cor === 'primaria' ? 'var(--cor-primaria)' : 'transparent', color: cor === 'primaria' ? '#fff' : 'var(--cor-texto-suave)', border: cor === 'primaria' ? 'none' : '1px solid var(--cor-borda)' }),
    select: { width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '0.85rem' },
    input: { width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '0.85rem', textAlign: 'center' },
  }

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onFechar() }}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>📄 Importar receita via PDF</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>
              Produto: <strong>{produto.nome}</strong>
            </div>
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--cor-texto-suave)', lineHeight: 1 }}>×</button>
        </div>

        <div style={S.body}>
          {/* Fase: upload */}
          {(fase === 'upload' || fase === 'processando') && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📑</div>
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>Selecione o PDF com a receita</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)', marginBottom: '20px' }}>
                O sistema vai extrair os ingredientes automaticamente e te deixar revisar antes de salvar.
                O PDF precisa ter texto selecionável (não pode ser uma foto escaneada).
              </div>

              {fase === 'processando' ? (
                <div style={{ padding: '20px', color: 'var(--cor-primaria)', fontWeight: 600 }}>
                  ⏳ Lendo o PDF...
                </div>
              ) : (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => processar(e.target.files?.[0])}
                  />
                  <button onClick={() => fileRef.current.click()} style={{ ...S.btn('primaria'), padding: '14px 32px', fontSize: '1rem' }}>
                    📂 Escolher PDF
                  </button>
                </>
              )}

              {erro && (
                <div style={{ marginTop: '16px', background: 'rgba(239,68,68,0.1)', color: 'var(--cor-perigo)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left' }}>
                  ⚠️ {erro}
                </div>
              )}
            </div>
          )}

          {/* Fase: revisar */}
          {fase === 'revisar' && (
            <>
              <div style={{ marginBottom: '16px', fontSize: '0.88rem', color: 'var(--cor-texto-suave)' }}>
                Encontrei <strong style={{ color: 'var(--cor-texto)' }}>{ingredientes.length} ingredientes</strong> no PDF.
                Associe cada um a um insumo cadastrado, ajuste as quantidades e remova o que não for necessário.
              </div>

              {erro && (
                <div style={{ marginBottom: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--cor-perigo)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  ⚠️ {erro}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ingredientes.map((ing, idx) => (
                  <div key={idx} style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginBottom: '8px', fontStyle: 'italic' }}>
                      PDF: "{ing.linhaOriginal}"
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 90px 1fr auto', gap: '8px', alignItems: 'center' }}>
                      {/* Quantidade */}
                      <input
                        type="number"
                        value={ing.qtd}
                        onChange={e => atualizarIng(idx, 'qtd', parseFloat(e.target.value) || 0)}
                        style={S.input}
                        placeholder="Qtd"
                      />
                      {/* Unidade */}
                      <select value={ing.unidade} onChange={e => atualizarIng(idx, 'unidade', e.target.value)} style={S.select}>
                        {['kg', 'g', 'ml', 'l', 'un', 'xícara', 'colher'].map(u => <option key={u}>{u}</option>)}
                      </select>
                      {/* Insumo */}
                      <select
                        value={ing.insumoId}
                        onChange={e => {
                          const sel = insumos.find(i => i.id === e.target.value)
                          atualizarIng(idx, 'insumoId', e.target.value)
                          atualizarIng(idx, 'insumoNome', sel?.nome || '')
                        }}
                        style={{ ...S.select, borderColor: ing.insumoId ? 'var(--cor-borda)' : 'var(--cor-atencao)' }}
                      >
                        <option value="">— selecionar insumo —</option>
                        {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                      </select>
                      {/* Remover */}
                      <button onClick={() => removerIng(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cor-perigo)', fontSize: '1.1rem', padding: '0 4px' }}>✕</button>
                    </div>
                    {ing.insumoId && (
                      <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--cor-sucesso)' }}>
                        ✓ Associado a: {ing.insumoNome}
                      </div>
                    )}
                    {!ing.insumoId && (
                      <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--cor-atencao)' }}>
                        ⚠ Selecione o insumo correspondente (ou remova esta linha)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Fase: concluido */}
          {fase === 'concluido' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>Receita importada!</div>
              <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>
                Os ingredientes foram salvos na ficha técnica de <strong>{produto.nome}</strong>.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          {fase === 'concluido' && (
            <button onClick={onFechar} style={S.btn('primaria')}>Fechar</button>
          )}
          {fase === 'revisar' && (
            <>
              <button onClick={() => { setFase('upload'); setIngredientes([]) }} style={S.btn('neutro')}>
                ← Voltar
              </button>
              <button onClick={salvar} style={S.btn('primaria')} disabled={!ingredientes.some(i => i.insumoId)}>
                💾 Salvar ficha técnica
              </button>
            </>
          )}
          {(fase === 'upload' || fase === 'processando') && fase !== 'processando' && (
            <button onClick={onFechar} style={S.btn('neutro')}>Cancelar</button>
          )}
        </div>
      </div>
    </div>
  )
}
