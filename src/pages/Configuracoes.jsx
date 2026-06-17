import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'

// ── Componente QR Card imprimível ─────────────────────────────────────────────
function QRCardPrint({ nomeEmpresa, qrUrl, onFechar }) {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
  const appUrl = `${window.location.origin}${BASE}/cozinha?t=${qrUrl}`

  function imprimir() {
    window.print()
  }

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-card-print, #qr-card-print * { visibility: visible !important; }
          #qr-card-print {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 148mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
        @media screen {
          #qr-print-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.85);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
            padding: 24px;
          }
        }
      `}</style>

      <div id="qr-print-overlay">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '400px' }}>

          {/* O card que será impresso */}
          <div id="qr-card-print" style={{
            width: '100%', background: 'white', borderRadius: '16px',
            overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          }}>
            {/* Header laranja */}
            <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>
                ProduzFácil <span style={{ fontWeight: 400, opacity: 0.85, fontSize: '1.1rem' }}>CMV</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '2px', fontWeight: 500 }}>
                Controle de Custos de Produção
              </div>
            </div>

            {/* Corpo */}
            <div style={{ padding: '28px 24px', textAlign: 'center', background: '#fafafa' }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', marginBottom: '4px' }}>
                {nomeEmpresa}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px', fontWeight: 500 }}>
                Registro de Produção da Cozinha
              </div>

              {/* QR Code */}
              <div style={{ display: 'inline-flex', padding: '16px', background: 'white', borderRadius: '16px', border: '3px solid #f97316', marginBottom: '20px' }}>
                <QRCodeSVG value={appUrl} size={180} level="H" includeMargin={false} />
              </div>

              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: '8px' }}>
                📱 Escaneie para registrar
              </div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Abra a câmera do celular e aponte para o QR Code.<br />
                Em seguida, informe o PIN com o administrador.
              </div>

              {/* Divisor */}
              <div style={{ borderTop: '2px dashed #e2e8f0', margin: '0 0 20px' }} />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⚖️</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Informe os pesos</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🧂</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Liste ingredientes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>💾</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Salve a produção</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: '#1e293b', padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                produzfacil.com.br · Escaneie o QR Code acima
              </div>
            </div>
          </div>

          {/* Botões (não aparecem na impressão) */}
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={onFechar} style={{ flex: 1, padding: '14px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit' }}>
              Fechar
            </button>
            <button onClick={imprimir} style={{ flex: 2, padding: '14px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit' }}>
              🖨️ Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Configuracoes() {
  const { user } = useAuth()
  const [empresaId, setEmpresaId] = useState(null)
  const [logoUrl, setLogoUrl]     = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [uploading, setUploading] = useState(false)
  const [salvando, setSalvando]   = useState(false)
  const [msg, setMsg]             = useState('')

  // Cozinha
  const [tokenCozinha, setTokenCozinha]   = useState(null)
  const [pinCozinha, setPinCozinha]       = useState('')
  const [pinVisivel, setPinVisivel]       = useState(false)
  const [alterandoPin, setAlterandoPin]   = useState(false)
  const [novoPinTemp, setNovoPinTemp]     = useState('')
  const [funcionarios, setFuncionarios]   = useState([])
  const [novoFunc, setNovoFunc]           = useState('')
  const [gerandoQR, setGerandoQR]         = useState(false)
  const [mostrarQR, setMostrarQR]         = useState(false)

  useEffect(() => { carregar() }, [user])

  async function carregar() {
    if (!user) return
    const { data: usuario } = await supabase
      .from('usuarios').select('empresa_id').eq('id', user.id).single()
    if (!usuario?.empresa_id) return
    setEmpresaId(usuario.empresa_id)

    const { data: empresa } = await supabase
      .from('empresas').select('nome, logo_url, token_cozinha, pin_cozinha, funcionarios').eq('id', usuario.empresa_id).single()
    if (empresa) {
      setNomeEmpresa(empresa.nome || '')
      setLogoUrl(empresa.logo_url || null)
      setTokenCozinha(empresa.token_cozinha || null)
      setPinCozinha(empresa.pin_cozinha || '')
      setFuncionarios(empresa.funcionarios || [])
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

  async function gerarQRCozinha() {
    if (!pinCozinha || pinCozinha.length < 4) { mostrarMsg('⚠️ PIN deve ter pelo menos 4 dígitos.'); return }
    if (!empresaId) return
    setGerandoQR(true)
    const { data, error } = await supabase.rpc('criar_usuario_cozinha', {
      p_empresa_id: empresaId,
      p_pin: pinCozinha,
    })
    if (error) { mostrarMsg('Erro ao gerar QR: ' + error.message); setGerandoQR(false); return }
    setTokenCozinha(data.token)
    await salvarFuncionarios()
    setGerandoQR(false)
    mostrarMsg('✅ QR Code gerado com sucesso!')
  }

  async function revogarQR() {
    if (!window.confirm('Revogar o QR atual e gerar um novo? O QR antigo deixará de funcionar.')) return
    setTokenCozinha(null)
    await supabase.from('empresas').update({ token_cozinha: null, pin_cozinha: null, kitchen_user_id: null }).eq('id', empresaId)
    mostrarMsg('QR revogado. Gere um novo quando quiser.')
  }

  async function salvarNovoPin() {
    if (!novoPinTemp || novoPinTemp.length < 4) { mostrarMsg('⚠️ PIN deve ter pelo menos 4 dígitos.'); return }
    setGerandoQR(true)
    const { data, error } = await supabase.rpc('criar_usuario_cozinha', {
      p_empresa_id: empresaId,
      p_pin: novoPinTemp,
    })
    if (error) { mostrarMsg('Erro ao atualizar PIN: ' + error.message); setGerandoQR(false); return }
    setPinCozinha(novoPinTemp)
    setNovoPinTemp('')
    setAlterandoPin(false)
    setTokenCozinha(data.token)
    setGerandoQR(false)
    mostrarMsg('✅ PIN atualizado com sucesso!')
  }

  async function salvarFuncionarios() {
    if (!empresaId) return
    await supabase.from('empresas').update({ funcionarios }).eq('id', empresaId)
  }

  function adicionarFuncionario() {
    const nome = novoFunc.trim()
    if (!nome || funcionarios.includes(nome)) return
    const novo = [...funcionarios, nome]
    setFuncionarios(novo)
    setNovoFunc('')
    supabase.from('empresas').update({ funcionarios: novo }).eq('id', empresaId)
  }

  function removerFuncionario(nome) {
    const novo = funcionarios.filter(f => f !== nome)
    setFuncionarios(novo)
    supabase.from('empresas').update({ funcionarios: novo }).eq('id', empresaId)
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

      {/* ── SEÇÃO COZINHA ── */}
      <div className="card" style={{ maxWidth: '800px', marginTop: '24px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>👨‍🍳 Acesso da Cozinha — QR Code</div>
        <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Cole o QR Code impresso na cozinha. O funcionário escaneia, digita o PIN e registra a produção — sem precisar de login.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

          {/* Funcionários */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: '12px' }}>👥 Funcionários da cozinha</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                value={novoFunc}
                onChange={e => setNovoFunc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarFuncionario()}
                placeholder="Nome do funcionário"
                style={{ flex: 1, padding: '10px 14px', border: '2px solid var(--cor-borda)', borderRadius: '8px', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '0.95rem', fontFamily: 'inherit' }}
              />
              <button onClick={adicionarFuncionario} className="btn btn-primario" style={{ padding: '10px 16px' }}>+</button>
            </div>
            {funcionarios.length === 0
              ? <div style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhum funcionário cadastrado.</div>
              : funcionarios.map(nome => (
                <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--cor-fundo)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--cor-borda)' }}>
                  <span style={{ fontWeight: 600 }}>👤 {nome}</span>
                  <button onClick={() => removerFuncionario(nome)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cor-perigo)', fontSize: '1.1rem' }}>✕</button>
                </div>
              ))
            }
          </div>

          {/* PIN e QR */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: '12px' }}>🔑 PIN de acesso</div>

            {/* PIN atual com olho */}
            {pinCozinha ? (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ flex: 1, padding: '12px 16px', border: '2px solid var(--cor-borda)', borderRadius: '8px', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '1.2rem', textAlign: 'center', letterSpacing: pinVisivel ? '0.2rem' : '0.5rem', fontFamily: 'monospace' }}>
                    {pinVisivel ? pinCozinha : '•'.repeat(pinCozinha.length)}
                  </div>
                  <button
                    onClick={() => setPinVisivel(v => !v)}
                    title={pinVisivel ? 'Ocultar PIN' : 'Ver PIN'}
                    style={{ padding: '12px 14px', border: '2px solid var(--cor-borda)', borderRadius: '8px', background: 'var(--cor-fundo)', color: 'var(--cor-texto-suave)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}
                  >
                    {pinVisivel ? '🙈' : '👁️'}
                  </button>
                  <button
                    onClick={() => { setAlterandoPin(v => !v); setNovoPinTemp('') }}
                    title="Alterar PIN"
                    style={{ padding: '12px 14px', border: '2px solid var(--cor-borda)', borderRadius: '8px', background: alterandoPin ? 'rgba(249,115,22,0.1)' : 'var(--cor-fundo)', color: alterandoPin ? 'var(--cor-primaria)' : 'var(--cor-texto-suave)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, borderColor: alterandoPin ? 'var(--cor-primaria)' : 'var(--cor-borda)' }}
                  >
                    ✏️
                  </button>
                </div>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--cor-texto-suave)', marginBottom: alterandoPin ? '12px' : '16px' }}>
                  PIN atual. Clique no 👁️ para ver ou ✏️ para alterar.
                </span>

                {/* Campo de novo PIN */}
                {alterandoPin && (
                  <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid var(--cor-primaria)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--cor-primaria)' }}>Novo PIN</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text" inputMode="numeric" maxLength={6} placeholder="4 a 6 dígitos"
                        value={novoPinTemp} onChange={e => setNovoPinTemp(e.target.value.replace(/\D/g, ''))}
                        style={{ flex: 1, padding: '10px 14px', border: '2px solid var(--cor-borda)', borderRadius: '8px', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.3rem', fontFamily: 'monospace' }}
                      />
                      <button onClick={salvarNovoPin} disabled={gerandoQR} className="btn btn-primario" style={{ whiteSpace: 'nowrap' }}>
                        {gerandoQR ? '⏳' : '✅ Salvar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <input
                  type="text" inputMode="numeric" maxLength={6} placeholder="4 a 6 dígitos"
                  value={pinCozinha} onChange={e => setPinCozinha(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--cor-borda)', borderRadius: '8px', background: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.3rem', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '8px' }}
                />
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--cor-texto-suave)', marginBottom: '16px' }}>
                  Crie um PIN de 4 a 6 dígitos para a cozinha.
                </span>
              </>
            )}

            {!tokenCozinha ? (
              <button onClick={gerarQRCozinha} disabled={gerandoQR} className="btn btn-primario" style={{ width: '100%' }}>
                {gerandoQR ? '⏳ Gerando...' : '📱 Gerar QR Code da Cozinha'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setMostrarQR(true)} className="btn btn-primario" style={{ width: '100%' }}>
                  🖨️ Ver e Imprimir QR Code
                </button>
                <button onClick={revogarQR} style={{ width: '100%', padding: '10px', border: '2px solid var(--cor-perigo)', borderRadius: '8px', background: 'transparent', color: 'var(--cor-perigo)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.85rem' }}>
                  🔄 Revogar e Gerar Novo QR
                </button>
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid var(--cor-sucesso)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--cor-sucesso)', textAlign: 'center', fontWeight: 600 }}>
                  ✅ QR Code ativo — cozinha pode acessar
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarQR && tokenCozinha && (
        <QRCardPrint
          nomeEmpresa={nomeEmpresa}
          qrUrl={tokenCozinha}
          onFechar={() => setMostrarQR(false)}
        />
      )}

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
