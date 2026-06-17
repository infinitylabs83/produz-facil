import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const WPP = '5598991289090'

function wppLink(origem) {
  const msg = encodeURIComponent(`Olá! Vi o ProduzFácil CMV e quero saber mais sobre o beta gratuito. (${origem})`)
  return `https://wa.me/${WPP}?text=${msg}`
}

// ── Ícones SVG ──────────────────────────────────────────────────────────────
const IconWpp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.86L.057 23.427a.75.75 0 0 0 .921.921l5.565-1.479A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.793-.538-5.362-1.473l-.384-.228-3.984 1.058 1.058-3.984-.228-.384A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const IconChevron = ({ aberto }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: aberto ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s ease' }}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

// ── Formatação ──────────────────────────────────────────────────────────────
function formatarTelefone(valor) {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2)  return nums
  if (nums.length <= 7)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 11) return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
  return valor
}

// ── Botão WhatsApp ──────────────────────────────────────────────────────────
function BtnWpp({ texto, origem, full, outline }) {
  const [hov, setHov] = useState(false)
  return (
    <a href={wppLink(origem)} target="_blank" rel="noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: outline ? 'transparent' : (hov ? '#1ebe5a' : '#25D366'),
        color: outline ? '#25D366' : 'white',
        border: outline ? '2px solid #25D366' : 'none',
        fontWeight: 700, padding: '14px 26px', borderRadius: '12px',
        textDecoration: 'none', fontSize: '0.95rem',
        transition: 'all 0.2s', width: full ? '100%' : 'auto',
        transform: hov ? 'translateY(-1px)' : 'none',
        boxShadow: hov ? '0 8px 25px rgba(37,211,102,0.35)' : 'none',
      }}
    >
      <IconWpp /> {texto}
    </a>
  )
}

// ── Confirmação de inscrição ────────────────────────────────────────────────
function ConfirmacaoInscricao({ nome }) {
  const primeiroNome = nome.split(' ')[0]
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#22c55e', marginBottom: '8px' }}>
        {primeiroNome}, sua vaga está garantida!
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '16px' }}>
        Enviamos um <strong style={{ color: '#f1f5f9' }}>link de acesso para o seu e-mail</strong>. Clique nele para confirmar sua inscrição.
      </p>
      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left' }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
        <div style={{ fontSize: '0.85rem', color: '#fcd34d', lineHeight: 1.6 }}>
          <strong>Verifique o spam!</strong> Confira também a caixa de lixo eletrônico se não receber em alguns minutos.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', textAlign: 'left' }}>
        {[
          { n: '1', titulo: 'Clique no link no e-mail', desc: 'Confirme sua inscrição e acesse o sistema.' },
          { n: '2', titulo: 'Entre no grupo beta', desc: 'Você receberá o link do grupo de beta testadores no WhatsApp.' },
          { n: '3', titulo: 'Acesse e explore', desc: 'Use gratuitamente por 30 dias e registre suas primeiras produções.' },
          { n: '4', titulo: 'Dê seu feedback', desc: 'A cada 15 dias enviamos um formulário rápido. Seu feedback molda o produto.' },
        ].map(p => (
          <div key={p.n} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0, color: 'white' }}>{p.n}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '2px' }}>{p.titulo}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <BtnWpp texto="Falar no WhatsApp agora" origem="pos_inscricao" full />
    </div>
  )
}

// ── Formulário beta ─────────────────────────────────────────────────────────
function FormBeta() {
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', restaurante: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const inputStyle = {
    padding: '13px 16px', borderRadius: '10px', border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: '0.97rem',
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await supabase.from('leads').insert({
      nome: form.nome, email: form.email,
      whatsapp: form.whatsapp, restaurante: form.restaurante,
      origem: 'landing_beta',
    })
    if (error) { setEnviando(false); setErro('Erro ao enviar. Tente pelo WhatsApp.'); return }
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    const redirectUrl = `${window.location.origin}${base}/login`
    const senhaTemp = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase() + '!9'
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: senhaTemp,
      options: { emailRedirectTo: redirectUrl, data: { nome: form.nome } },
    })
    setEnviando(false)
    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('user already')) {
        await supabase.auth.signInWithOtp({ email: form.email, options: { emailRedirectTo: redirectUrl } })
      } else {
        setErro(`Erro ao enviar e-mail: ${signUpError.message}. Tente pelo WhatsApp.`)
        return
      }
    }
    setEnviado(true)
  }

  if (enviado) return <ConfirmacaoInscricao nome={form.nome || 'Olá'} />

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {erro && <div style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem' }}>{erro}</div>}
      {[
        { type: 'text', placeholder: 'Seu nome completo', key: 'nome' },
        { type: 'text', placeholder: 'Nome do restaurante / estabelecimento', key: 'restaurante' },
        { type: 'email', placeholder: 'Seu melhor e-mail', key: 'email' },
      ].map(({ type, placeholder, key }) => (
        <input key={key} style={inputStyle} type={type} placeholder={placeholder} required
          value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      ))}
      <input style={inputStyle} type="tel" placeholder="WhatsApp: (XX) XXXXX-XXXX" required
        value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: formatarTelefone(e.target.value) }))}
        onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      <button type="submit" disabled={enviando}
        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', fontWeight: 800, fontSize: '1rem', padding: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer', opacity: enviando ? 0.7 : 1, marginTop: '4px', letterSpacing: '0.01em' }}>
        {enviando ? 'Enviando...' : 'Quero meu acesso beta gratuito →'}
      </button>
      <div style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
        Sem cartão de crédito · Sem compromisso · Acesso em até 24h
      </div>
    </form>
  )
}

// ── Marquee ─────────────────────────────────────────────────────────────────
const MARQUEE_ITENS = [
  'Custo real por porção', 'Menos desperdício', 'Dashboard gerencial',
  'Diagnóstico automático', 'Compare fornecedores', 'Simples para a cozinha',
  'Controle de CMV', 'Ficha técnica digital', 'Metas de rendimento',
  'Registro em 2 minutos', 'Escala de receitas', 'Decisões com dados reais',
]

function Marquee() {
  const itens = [...MARQUEE_ITENS, ...MARQUEE_ITENS]
  return (
    <div style={{ overflow: 'hidden', background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '14px 0', width: '100%' }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { display: flex; gap: 0; animation: marquee 32s linear infinite; width: max-content; }
        .marquee-track:hover { animation-play-state: paused; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
        @keyframes glowPulse { 0%,100% { opacity:0.5; transform:scale(1) } 50% { opacity:0.8; transform:scale(1.05) } }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>
      <div className="marquee-track">
        {itens.map((item, i) => (
          <span key={i} style={{ padding: '0 32px', color: 'white', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.25)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Mock dashboard (visual) ─────────────────────────────────────────────────
function DashboardMock() {
  return (
    <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(249,115,22,0.3)', padding: '20px', fontFamily: 'monospace', fontSize: '0.8rem', boxShadow: '0 0 60px rgba(249,115,22,0.15), 0 40px 80px rgba(0,0,0,0.5)' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ marginLeft: '8px', color: '#475569', fontSize: '0.72rem' }}>ProduzFácil CMV — Dashboard</span>
      </div>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'CMV Hoje', val: 'R$ 4,82', sub: 'por porção', cor: '#f97316' },
          { label: 'Rendimento', val: '82,4%', sub: 'meta: 80%', cor: '#22c55e' },
          { label: 'Perda Total', val: '17,6%', sub: '↓ vs ontem', cor: '#3b82f6' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#64748b', fontSize: '0.65rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
            <div style={{ color: m.cor, fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit', marginBottom: '2px' }}>{m.val}</div>
            <div style={{ color: '#475569', fontSize: '0.62rem' }}>{m.sub}</div>
          </div>
        ))}
      </div>
      {/* Bar chart fake */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ color: '#64748b', fontSize: '0.65rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rendimento — últimos 7 dias</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '48px' }}>
          {[68,75,80,77,83,86,82].map((h, i) => (
            <div key={i} style={{ flex: 1, background: i === 6 ? '#f97316' : 'rgba(249,115,22,0.3)', borderRadius: '3px 3px 0 0', height: `${(h/100)*48}px`, transition: 'height 0.3s ease' }} />
          ))}
        </div>
      </div>
      {/* List */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ color: '#64748b', fontSize: '0.65rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Últimas produções</div>
        {[
          { nome: 'Frango grelhado', op: 'Gislene', status: '✅', cor: '#22c55e' },
          { nome: 'Filé de peixe', op: 'Carlos', status: '⚠️', cor: '#f59e0b' },
          { nome: 'Costela bovina', op: 'Ana', status: '✅', cor: '#22c55e' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div>
              <div style={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 600 }}>{r.nome}</div>
              <div style={{ color: '#475569', fontSize: '0.62rem' }}>{r.op}</div>
            </div>
            <span style={{ color: r.cor, fontSize: '0.7rem' }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Seção FAQ item ──────────────────────────────────────────────────────────
function FaqItem({ q, r }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ borderRadius: '12px', border: `1px solid ${aberto ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden', transition: 'border-color 0.2s', background: aberto ? 'rgba(249,115,22,0.04)' : 'rgba(255,255,255,0.02)' }}>
      <button onClick={() => setAberto(!aberto)}
        style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', gap: '12px', fontFamily: 'inherit' }}>
        {q}
        <span style={{ flexShrink: 0, color: '#f97316' }}><IconChevron aberto={aberto} /></span>
      </button>
      {aberto && <div style={{ padding: '0 20px 18px', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>{r}</div>}
    </div>
  )
}

// ── Dados ────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '📊', titulo: 'Custo real por porção', desc: 'Saiba exatamente quanto custa cada prato considerando perdas e ingredientes reais, atualizado a cada produção.' },
  { icon: '🔍', titulo: 'Diagnóstico automático', desc: 'O sistema identifica se o problema está na limpeza, no preparo ou no preço dos insumos — sem você precisar analisar.' },
  { icon: '🔄', titulo: 'Comparação de fornecedores', desc: 'Veja qual fornecedor entrega mais rendimento pelo melhor preço, com dados reais de produção.' },
  { icon: '📱', titulo: 'Simples para a equipe', desc: 'O cozinheiro registra em 2 minutos no celular. Sem planilha, sem treinamento longo, sem erro.' },
  { icon: '📈', titulo: 'Histórico e tendências', desc: 'Acompanhe custo, rendimento e desperdício ao longo do tempo com gráficos claros e objetivos.' },
  { icon: '🔒', titulo: 'Controle por perfil', desc: 'Operador só registra produção. Gestor vê tudo. Seus custos e margens protegidos da equipe.' },
]

const FAQ = [
  { q: 'Preciso instalar algum aplicativo?', r: 'Não. O ProduzFácil funciona direto no navegador — computador, tablet ou celular. Sem instalação.' },
  { q: 'Minha equipe da cozinha consegue usar?', r: 'Sim. A interface do operador tem 4 etapas visuais simples. Se ele usa WhatsApp, usa o ProduzFácil.' },
  { q: 'O beta é realmente gratuito?', r: 'Sim, 100% gratuito por 30 dias. Sem cartão de crédito. Sem cobrança surpresa. Cancele quando quiser.' },
  { q: 'O que acontece depois do beta?', r: 'Você recebe uma oferta exclusiva de early adopter com desconto permanente. Sem obrigação de continuar.' },
  { q: 'Meus dados ficam seguros?', r: 'Sim. Armazenados no Supabase (infraestrutura AWS) com criptografia e backups automáticos.' },
  { q: 'Funciona para mais de um restaurante?', r: 'Sim. Cada unidade é independente com dados separados.' },
]

// ── Landing page ─────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#080f1e', color: '#f1f5f9', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: rgba(249,115,22,0.3); }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', backdropFilter: 'blur(16px)', background: 'rgba(8,15,30,0.85)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🍳</div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              ProduzFácil <span style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>CMV</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href={wppLink('header')} target="_blank" rel="noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, padding: '8px 12px' }}>
              Fale conosco
            </a>
            <button onClick={() => navigate('/login')}
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.4)', color: '#f97316', fontWeight: 700, padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.2)'; e.currentTarget.style.borderColor = '#f97316' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)' }}>
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

        {/* Background glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, transparent 70%)', animation: 'glowPulse 6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '30%', left: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)' }} />
          {/* Grid pattern */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.03 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>

          {/* Left — copy */}
          <div style={{ animation: 'fadeUp 0.7s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c', fontWeight: 600, fontSize: '0.75rem', padding: '6px 14px', borderRadius: '100px', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', display: 'inline-block', animation: 'glowPulse 2s infinite' }} />
              Beta gratuito · Vagas limitadas
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '20px' }}>
              Descubra quanto custa{' '}
              <span style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                cada prato
              </span>
              {' '}que sai da sua cozinha
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '36px', maxWidth: '500px' }}>
              O ProduzFácil CMV calcula o custo real por porção, identifica onde sua cozinha perde dinheiro e compara fornecedores automaticamente — tudo pelo celular.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <button onClick={() => document.getElementById('beta').scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', fontWeight: 800, fontSize: '1rem', padding: '15px 28px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(249,115,22,0.4)', transition: 'all 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(249,115,22,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(249,115,22,0.4)' }}>
                Quero acesso gratuito <IconArrow />
              </button>
              <BtnWpp texto="Tirar dúvidas" origem="hero" outline />
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[
                { val: '2 min', label: 'para registrar uma produção' },
                { val: '30 dias', label: 'de acesso gratuito' },
                { val: '100%', label: 'no celular, sem instalar' },
              ].map((s, i) => (
                <div key={i} style={{ borderLeft: '2px solid rgba(249,115,22,0.4)', paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f97316' }}>{s.val}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mock */}
          <div style={{ animation: 'scaleIn 0.8s ease 0.2s both' }}>
            <DashboardMock />
          </div>
        </div>

        {/* Mobile: stack vertically */}
        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-mock { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── MARQUEE ── */}
      <Marquee />

      {/* ── PROBLEMA ── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(180deg, #080f1e 0%, #0d1626 100%)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>O problema</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.2 }}>
            Reconhece alguma dessas situações?
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '56px' }}>Se sim, o ProduzFácil foi feito para você.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              { titulo: 'Você sabe quanto custa cada prato?', desc: 'A maioria dos gestores tem uma estimativa. Mas estimativa não paga conta — e a diferença costuma ser prejuízo escondido.' },
              { titulo: 'Sua cozinha desperdiça e você não sabe onde', desc: 'Perda na limpeza, perda no preparo, variação de rendimento entre cozinheiros. Tudo isso come sua margem em silêncio.' },
              { titulo: 'Qual fornecedor realmente compensa?', desc: 'Sem comparação real de preço × rendimento, você decide no achismo. E achismo em food cost é dinheiro no lixo.' },
            ].map((d, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', color: '#ef4444' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '10px', lineHeight: 1.4 }}>{d.titulo}</h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANTES × DEPOIS ── */}
      <section style={{ padding: '96px 24px', background: '#0d1626' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Transformação</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              A diferença que o controle real faz
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

            {/* Antes */}
            <div style={{ borderRadius: '20px', padding: '32px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </div>
                <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.95rem' }}>Sem o ProduzFácil</span>
              </div>
              {[
                'Custo por prato? "Acho que é uns R$ X..."',
                'Perda descoberta só quando o estoque fecha',
                'Fornecedor escolhido pelo preço da nota, não pelo rendimento real',
                'Cozinheiro preenche planilha errada ou não preenche',
                'Prejudizo aparece no caixa, mas a causa é um mistério',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px', fontSize: '0.87rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }}><IconX /></span> {item}
                </div>
              ))}
            </div>

            {/* Depois */}
            <div style={{ borderRadius: '20px', padding: '32px', border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <span style={{ fontWeight: 800, color: '#22c55e', fontSize: '0.95rem' }}>Com o ProduzFácil</span>
              </div>
              {[
                'Custo real por porção atualizado a cada produção',
                'Sistema alerta quando a perda está acima do histórico',
                'Comparação de fornecedores com dados reais de rendimento',
                'Cozinheiro registra em 2 min no celular — sem erro',
                'Dashboard mostra qual produto tem o maior problema',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px', fontSize: '0.87rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <span style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }}><IconCheck /></span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ padding: '96px 24px', background: '#080f1e', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Como funciona</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.2 }}>
            O ProduzFácil{' '}
            <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              transforma produção em dado
            </span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 64px' }}>
            O cozinheiro registra pesos e ingredientes no celular. O sistema calcula automaticamente perda, rendimento, custo por porção e gera diagnóstico em tempo real.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { n: '01', t: 'Cozinheiro registra', d: 'Pesos + ingredientes em 2 min pelo celular', cor: '#f97316' },
              { n: '02', t: 'Sistema calcula', d: 'Custo, rendimento e perdas automaticamente', cor: '#fb923c' },
              { n: '03', t: 'Gestor decide', d: 'Com dados reais, não achismo nem planilha', cor: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '28px 20px', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.04)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${s.cor}22, ${s.cor}11)`, border: `1px solid ${s.cor}44`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', color: s.cor, marginBottom: '16px' }}>
                  {i + 1}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px', textAlign: 'left' }}>{s.t}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'left', lineHeight: 1.6 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (bento grid) ── */}
      <section style={{ padding: '96px 24px', background: '#0d1626' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Recursos</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              O que você ganha com o ProduzFácil
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '22px 20px', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; e.currentTarget.style.background = 'rgba(249,115,22,0.04)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '1.6rem', flexShrink: 0, width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(249,115,22,0.08)', borderRadius: '10px' }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>{f.titulo}</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OBJECTIONS ── */}
      <section style={{ padding: '96px 24px', background: '#080f1e' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Objeções comuns</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Ainda com dúvidas? Entendemos.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {[
              { obj: '"Minha equipe não vai saber usar."', resp: 'A tela do cozinheiro tem 4 etapas visuais. Se ele usa WhatsApp, usa o ProduzFácil.' },
              { obj: '"Não tenho tempo para implantar."', resp: 'Cadastro em 15 minutos. Primeiro registro em menos de 5 minutos. Sem instalação.' },
              { obj: '"Já uso planilha, funciona."', resp: 'Planilha não detecta onde está o problema nem gera diagnóstico automático — e cozinheiro não preenche direto.' },
              { obj: '"E se eu não gostar?"', resp: 'No beta não há contrato nem cobrança. Cancele quando quiser, sem precisar explicar nada.' },
            ].map((o, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.88rem', marginBottom: '10px', fontStyle: 'italic' }}>{o.obj}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.87rem', lineHeight: 1.6 }}>{o.resp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETA FORM ── */}
      <section id="beta" style={{ padding: '96px 24px', background: 'linear-gradient(180deg, #0d1626 0%, #080f1e 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(249,115,22,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '520px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c', fontWeight: 600, fontSize: '0.75rem', padding: '6px 14px', borderRadius: '100px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
              Beta gratuito · vagas limitadas
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '12px' }}>
              Garanta seu acesso{' '}
              <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                gratuito por 30 dias
              </span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Em troca, pedimos apenas seu feedback quinzenal. Ao final, você recebe desconto exclusivo de early adopter.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '20px', padding: '36px 32px', border: '1px solid rgba(249,115,22,0.25)', backdropFilter: 'blur(10px)' }}>
            <FormBeta />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <BtnWpp texto="Prefiro falar pelo WhatsApp" origem="beta_section" outline />
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section style={{ padding: '96px 24px', background: '#080f1e' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Planos</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.2 }}>Planos para após o beta</h2>
          <p style={{ color: '#64748b', marginBottom: '56px', fontSize: '0.95rem' }}>Durante o beta você usa tudo gratuitamente. Estes serão os planos ao final.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
            {[
              { nome: 'Starter', preco: 'R$ 97', periodo: '/mês', desc: ['1 unidade', 'Até 5 operadores', 'Dashboard completo', 'Suporte por e-mail'], destaque: false },
              { nome: 'Pro', preco: 'R$ 197', periodo: '/mês', desc: ['1 unidade', 'Operadores ilimitados', 'Diagnóstico automático', 'Suporte prioritário'], destaque: true },
              { nome: 'Multi', preco: 'R$ 397', periodo: '/mês', desc: ['Múltiplas unidades', 'Tudo do Pro', 'Gestão centralizada', 'Onboarding dedicado'], destaque: false },
            ].map((p, i) => (
              <div key={i} style={{
                background: p.destaque ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.1))' : 'rgba(255,255,255,0.03)',
                borderRadius: '20px', padding: '32px 28px',
                border: p.destaque ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.08)',
                position: 'relative', display: 'flex', flexDirection: 'column',
              }}>
                {p.destaque && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: 800, fontSize: '0.7rem', padding: '4px 16px', borderRadius: '100px', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                    MAIS POPULAR
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>{p.nome}</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: p.destaque ? '#f97316' : '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '4px', lineHeight: 1 }}>{p.preco}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '24px' }}>{p.periodo}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {p.desc.map((d, j) => (
                    <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.87rem', color: '#94a3b8' }}>
                      <span style={{ color: '#22c55e', flexShrink: 0 }}><IconCheck /></span> {d}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '24px' }}>
            ⭐ Participantes do beta recebem desconto permanente de early adopter
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '96px 24px', background: '#0d1626' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>FAQ</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>Perguntas frequentes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FAQ.map((f, i) => <FaqItem key={i} q={f.q} r={f.r} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '96px 24px', background: '#080f1e', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '500px', background: 'radial-gradient(ellipse, rgba(249,115,22,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
            Pare de perder margem{' '}
            <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              sem saber por quê
            </span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, marginBottom: '40px' }}>
            Cada produção sem controle é dinheiro que sai sem deixar rastro. Comece agora, gratuitamente.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('beta').scrollIntoView({ behavior: 'smooth' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: 800, fontSize: '1rem', padding: '16px 32px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(249,115,22,0.4)', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(249,115,22,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(249,115,22,0.4)' }}>
              Garantir meu acesso gratuito <IconArrow />
            </button>
            <BtnWpp texto="Falar no WhatsApp" origem="cta_final" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '28px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🍳</div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>ProduzFácil CMV</span>
        </div>
        <div style={{ color: '#334155', fontSize: '0.8rem' }}>© 2026 ProduzFácil CMV · Todos os direitos reservados</div>
      </footer>

      {/* ── BOTÃO WPP FLUTUANTE ── */}
      <a href={wppLink('floating')} target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(37,211,102,0.45)', zIndex: 999, transition: 'transform 0.2s, box-shadow 0.2s', color: 'white' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(37,211,102,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,211,102,0.45)' }}>
        <IconWpp />
      </a>
    </div>
  )
}
