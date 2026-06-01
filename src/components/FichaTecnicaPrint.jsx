import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function FichaTecnicaPrint({ produto, ficha, onFechar }) {
  const { user } = useAuth()
  const [logoUrl, setLogoUrl]     = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')

  useEffect(() => {
    async function carregarEmpresa() {
      if (!user) return
      const { data: usuario } = await supabase
        .from('usuarios').select('empresa_id').eq('id', user.id).single()
      if (!usuario?.empresa_id) return
      const { data: empresa } = await supabase
        .from('empresas').select('nome, logo_url').eq('id', usuario.empresa_id).single()
      if (empresa) {
        setNomeEmpresa(empresa.nome || '')
        setLogoUrl(empresa.logo_url || null)
      }
    }
    carregarEmpresa()
  }, [user])

  function imprimir() {
    const conteudo = document.getElementById('ficha-print-content')
    if (!conteudo) return

    const janela = window.open('', '_blank', 'width=900,height=700')
    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Ficha Técnica — ${produto.nome}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; background: white; padding: 32px; }
            @media print {
              body { padding: 20px; }
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          ${conteudo.innerHTML}
        </body>
      </html>
    `)
    janela.document.close()
    janela.focus()
    setTimeout(() => { janela.print() }, 500)
  }

  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <>
      {/* Overlay + modal de prévia */}
      <div className="ficha-print-overlay" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
        <div className="ficha-print-modal" style={{
          background: 'var(--cor-fundo-card)', borderRadius: '16px', width: '100%', maxWidth: '700px',
          maxHeight: '90vh', overflow: 'auto', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          {/* Cabeçalho do modal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>📄 Ficha Técnica Operacional</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)', marginTop: '2px' }}>Prévia — preços omitidos</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={imprimir} className="btn btn-primario" style={{ padding: '10px 20px' }}>
                🖨️ Gerar PDF / Imprimir
              </button>
              <button onClick={onFechar} className="btn btn-secundario" style={{ padding: '10px 16px' }}>✕</button>
            </div>
          </div>

          {/* Prévia da ficha */}
          <div id="ficha-print-content">
            <PreviewFicha
              produto={produto} ficha={ficha}
              logoUrl={logoUrl} nomeEmpresa={nomeEmpresa} dataHoje={dataHoje}
            />
          </div>
        </div>
      </div>

    </>
  )
}

function PreviewFicha({ produto, ficha, logoUrl, nomeEmpresa, dataHoje, print }) {
  const base = {
    fontFamily: "'Inter', sans-serif",
    color: '#1e293b',
    background: 'white',
    padding: print ? '32px' : '0',
  }

  return (
    <div style={base}>
      {/* Cabeçalho: logo + nome empresa + título */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '3px solid #f97316', paddingBottom: '16px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" style={{ maxHeight: '56px', maxWidth: '160px', objectFit: 'contain' }} />
          )}
          <div>
            {nomeEmpresa && <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{nomeEmpresa}</div>}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Ficha Técnica Operacional</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
          <div>Emitido em {dataHoje}</div>
          <div style={{ fontWeight: 700, color: '#f97316', fontSize: '0.85rem', marginTop: '2px' }}>CONFIDENCIAL</div>
        </div>
      </div>

      {/* Nome do produto + foto */}
      <div style={{ display: 'grid', gridTemplateColumns: produto.foto_url ? '1fr 200px' : '1fr', gap: '20px', marginBottom: '20px', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f97316', marginBottom: '4px' }}>
            {produto.categoria || 'Produto'}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 12px', color: '#1e293b' }}>{produto.nome}</h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <InfoBox label="Porção padrão" valor={`${produto.porcao_padrao_g}g`} />
            <InfoBox label="Meta de rendimento" valor={`${produto.meta_rendimento}%`} />
          </div>
        </div>
        {produto.foto_url && (
          <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <img src={produto.foto_url} alt={produto.nome}
              style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
      </div>

      {/* Ingredientes */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
          🧂 Ingredientes
        </div>
        {ficha.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Nenhum ingrediente cadastrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>#</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>Ingrediente</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {ficha.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{f.insumos?.nome}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#f97316' }}>
                    {f.quantidade_padrao > 0 ? `${f.quantidade_padrao} ${f.unidade_uso}` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>livre</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modo de preparo */}
      {produto.modo_preparo && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            📝 Modo de Preparo
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.7', color: '#334155', whiteSpace: 'pre-wrap', background: '#f8fafc', borderRadius: '8px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            {produto.modo_preparo}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          {nomeEmpresa} — Uso interno restrito. Não divulgar.
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          ProduzFácil CMV
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, valor }) {
  return (
    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '8px 14px', minWidth: '120px' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', color: '#ea580c', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{valor}</div>
    </div>
  )
}
