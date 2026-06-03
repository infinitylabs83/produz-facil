import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Configuracoes() {
  const { user } = useAuth()
  const [empresaId, setEmpresaId] = useState(null)
  const [logoUrl, setLogoUrl]     = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [uploading, setUploading] = useState(false)
  const [salvando, setSalvando]   = useState(false)
  const [msg, setMsg]             = useState('')

  useEffect(() => { carregar() }, [user])

  async function carregar() {
    if (!user) return
    const { data: usuario } = await supabase
      .from('usuarios').select('empresa_id').eq('id', user.id).single()
    if (!usuario?.empresa_id) return
    setEmpresaId(usuario.empresa_id)

    const { data: empresa } = await supabase
      .from('empresas').select('nome, logo_url').eq('id', usuario.empresa_id).single()
    if (empresa) {
      setNomeEmpresa(empresa.nome || '')
      setLogoUrl(empresa.logo_url || null)
    }
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0]
    if (!file || !empresaId) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `logo_${empresaId}.${ext}`
    const { data, error } = await supabase.storage.from('empresa').upload(path, file, { upsert: true })
    if (error) { alert('Erro no upload: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('empresa').getPublicUrl(data.path)
    await supabase.from('empresas').update({ logo_url: publicUrl }).eq('id', empresaId)
    setLogoUrl(publicUrl)
    setUploading(false)
    mostrarMsg('Logo atualizada!')
  }

  async function removerLogo() {
    if (!window.confirm('Remover a logomarca?')) return
    await supabase.from('empresas').update({ logo_url: null }).eq('id', empresaId)
    setLogoUrl(null)
    mostrarMsg('Logo removida.')
  }

  async function salvarNome(e) {
    e.preventDefault()
    if (!empresaId || !nomeEmpresa.trim()) return
    setSalvando(true)
    await supabase.from('empresas').update({ nome: nomeEmpresa }).eq('id', empresaId)
    setSalvando(false)
    mostrarMsg('Nome da empresa salvo!')
  }

  function mostrarMsg(texto) {
    setMsg(texto)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Configurações</h1>
          <p className="pagina-subtitulo">Dados da empresa e personalização</p>
        </div>
      </div>

      {msg && <div className="mensagem-sucesso" style={{ marginBottom: '16px' }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '800px' }}>

        {/* Nome da empresa */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>🏢 Nome da empresa</div>
          <form onSubmit={salvarNome}>
            <div className="campo-grupo">
              <label>Nome exibido nas fichas técnicas</label>
              <input
                value={nomeEmpresa}
                onChange={e => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Restaurante Sabor & Arte"
              />
            </div>
            <button className="btn btn-primario" type="submit" disabled={salvando} style={{ width: '100%' }}>
              {salvando ? 'Salvando...' : '💾 Salvar nome'}
            </button>
          </form>
        </div>

        {/* Logo */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>🎨 Logomarca</div>

          {logoUrl ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                background: 'var(--cor-fundo)', borderRadius: '10px', padding: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--cor-borda)', marginBottom: '10px', minHeight: '80px',
              }}>
                <img src={logoUrl} alt="Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
              <button onClick={removerLogo} className="badge-perigo"
                style={{ border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', width: '100%' }}>
                🗑️ Remover logo
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--cor-fundo)', borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '16px', border: '1px dashed var(--cor-borda)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🖼️</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>Nenhuma logo cadastrada</div>
            </div>
          )}

          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', border: '2px dashed var(--cor-borda)', borderRadius: '10px',
            cursor: 'pointer', color: 'var(--cor-texto-suave)', fontSize: '0.9rem',
            background: 'var(--cor-fundo)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cor-primaria)'; e.currentTarget.style.color = 'var(--cor-primaria)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.color = 'var(--cor-texto-suave)' }}
          >
            {uploading ? '⏳ Enviando...' : '📷 Escolher imagem (PNG ou JPG)'}
            <input type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} disabled={uploading} />
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)', marginTop: '8px', textAlign: 'center' }}>
            Recomendado: fundo transparente (PNG), mínimo 300px de largura
          </p>
        </div>
      </div>

      {/* Aviso se bucket não existe */}
      {!empresaId && (
        <div className="alerta-box alerta-box-atencao" style={{ marginTop: '20px', maxWidth: '800px' }}>
          <div className="alerta-titulo" style={{ color: 'var(--cor-primaria)' }}>⚠️ Empresa não configurada</div>
          <p style={{ fontSize: '0.85rem' }}>
            Sua conta não está vinculada a uma empresa. Fale com o administrador do sistema.
          </p>
        </div>
      )}
    </div>
  )
}
