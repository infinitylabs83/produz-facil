import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const WPP = '5598991289090'
function wppLink(origem) {
  const msg = encodeURIComponent(`Olá! Vi o ProduzFácil CMV e quero saber mais sobre o beta gratuito. (${origem})`)
  return `https://wa.me/${WPP}?text=${msg}`
}

// Inject Google Fonts
function useFonts() {
  useEffect(() => {
    if (document.getElementById('lp-fonts')) return
    const link = document.createElement('link')
    link.id = 'lp-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

// Animated counter hook
function useCounter(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return value
}

// Intersection observer hook
function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, inView]
}

// Mobile detection
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ── Formatação telefone ──
function formatarTelefone(valor) {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2) return nums
  if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
}

// ── Paleta (slate azul elegante — mesma do app) ──
const C = {
  bg:      '#0f172a',
  surface: '#1e293b',
  border:  '#334155',
  orange:  '#f97316',
  amber:   '#f59e0b',
  text:    '#f1f5f9',
  muted:   '#64748b',
  green:   '#22c55e',
  red:     '#ef4444',
}

// ── CSS global styles ──
const LP_STYLE = `
  @keyframes lp-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes lp-pulse-glow {
    0%,100% { box-shadow: 0 0 30px 0px rgba(249,115,22,0.25); }
    50%      { box-shadow: 0 0 60px 8px rgba(249,115,22,0.45); }
  }
  @keyframes lp-slide-up {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-marquee {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes lp-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  @keyframes lp-bar-grow {
    from { width: 0%; }
    to   { width: var(--bar-w); }
  }
  .lp-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp-root { font-family: 'Manrope', sans-serif; background: ${C.bg}; color: ${C.text}; line-height: 1.55; overflow-x: hidden; }
  .lp-bebas { font-family: 'Bebas Neue', 'Impact', sans-serif; letter-spacing: 0.03em; line-height: 0.95; }
  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 10px; cursor: pointer; border: none;
    background: ${C.orange}; color: white; font-family: 'Manrope', sans-serif;
    font-size: 1rem; font-weight: 800; padding: 16px 32px; border-radius: 8px;
    text-decoration: none; transition: all 0.2s; letter-spacing: 0.01em;
    box-shadow: 0 4px 20px rgba(249,115,22,0.35);
  }
  .lp-btn-primary:hover { background: #ea580c; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(249,115,22,0.5); }
  .lp-btn-outline {
    display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
    background: transparent; color: ${C.text}; font-family: 'Manrope', sans-serif;
    font-size: 0.9rem; font-weight: 700; padding: 14px 28px; border-radius: 8px;
    text-decoration: none; transition: all 0.2s; border: 1.5px solid rgba(241,245,249,0.2);
  }
  .lp-btn-outline:hover { border-color: ${C.orange}; color: ${C.orange}; }
  .lp-label {
    display: inline-block; font-family: 'Manrope', sans-serif; font-size: 0.7rem;
    font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
    color: ${C.orange}; margin-bottom: 14px;
  }
  .lp-card {
    background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 12px;
    overflow: hidden;
  }
  .lp-faq-item { border-bottom: 1px solid ${C.border}; }
  .lp-faq-btn {
    width: 100%; background: none; border: none; cursor: pointer; color: ${C.text};
    font-family: 'Manrope', sans-serif; font-size: 1rem; font-weight: 700;
    padding: 22px 0; display: flex; justify-content: space-between; align-items: center;
    text-align: left; gap: 16px;
  }
  .lp-faq-btn:hover { color: ${C.orange}; }
  .lp-tag {
    display: inline-block; background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.3);
    color: ${C.orange}; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
  }
`

// ── Dashboard mock — reflete o visual real do app (slate azul + cards brancos) ──
function DashMock() {
  const barData = [72, 85, 68, 91, 84, 78, 88]
  const barMax = 100
  return (
    <div style={{
      borderRadius: '14px', overflow: 'hidden', fontFamily: 'Manrope, sans-serif',
      boxShadow: '0 0 0 1px rgba(255,106,0,0.25), 0 20px 60px rgba(0,0,0,0.6)',
      animation: 'lp-pulse-glow 3s ease-in-out infinite',
    }}>
      {/* Sidebar + content */}
      <div style={{ display: 'flex', height: '340px' }}>

        {/* Sidebar */}
        <div style={{ width: '120px', background: '#1e293b', display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' }}>
            <div style={{ color: '#f97316', fontWeight: 800, fontSize: '0.75rem' }}>ProduzFácil</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.08em' }}>CMV</div>
          </div>
          {[
            { icon: '📊', label: 'Dashboard', ativo: true },
            { icon: '🍳', label: 'Produção', ativo: false },
            { icon: '📅', label: 'Histórico', ativo: false },
            { icon: '📋', label: 'Cadastros', ativo: false },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
              margin: '1px 6px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 600,
              background: item.ativo ? '#f97316' : 'transparent',
              color: item.ativo ? 'white' : 'rgba(255,255,255,0.5)',
            }}>
              <span style={{ fontSize: '0.75rem' }}>{item.icon}</span> {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, background: '#f8fafc', padding: '14px', overflowY: 'hidden' }}>
          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'Custo/porção', value: 'R$ 4,38', delta: '↓12% vs mês anterior', up: false },
              { label: 'Rendimento', value: '84,2%', delta: '↑ acima da meta (80%)', up: true },
            ].map((m, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '10px', padding: '10px 12px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{ color: '#64748b', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
                <div style={{ color: '#1e293b', fontSize: '1rem', fontWeight: 800 }}>{m.value}</div>
                <div style={{ color: m.up ? '#22c55e' : '#ef4444', fontSize: '0.55rem', fontWeight: 700, marginTop: '3px' }}>{m.delta}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Rendimento por produção (%)
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '70px' }}>
              {barData.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div style={{
                    width: '100%', height: `${(v / barMax) * 70}px`,
                    background: v >= 80 ? '#f97316' : '#e2e8f0',
                    borderRadius: '3px 3px 0 0', transition: 'height 0.4s',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
                <div key={d} style={{ color: '#94a3b8', fontSize: '0.45rem', flex: 1, textAlign: 'center' }}>{d}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: '#1e293b', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem' }}>7 produções essa semana</span>
        <span style={{ background: '#f97316', color: 'white', fontSize: '0.5rem', fontWeight: 800, padding: '2px 8px', borderRadius: '3px', letterSpacing: '0.08em' }}>EXCELENTE</span>
      </div>
    </div>
  )
}

// ── FAQ item ──
function FaqItem({ pergunta, resposta }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="lp-faq-item">
      <button className="lp-faq-btn" onClick={() => setOpen(!open)}>
        <span>{pergunta}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s', color: open ? C.orange : 'inherit' }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {open && (
        <div style={{ color: C.muted, fontSize: '0.95rem', lineHeight: 1.7, paddingBottom: '22px' }}>
          {resposta}
        </div>
      )}
    </div>
  )
}

// ── Step card ──
function StepCard({ num, titulo, desc, icon }) {
  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
        background: 'rgba(255,106,0,0.12)', border: '1px solid rgba(255,106,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.orange, fontSize: '1.1rem',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: C.orange, fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {num.toString().padStart(2, '0')}
        </div>
        <div style={{ color: C.text, fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>{titulo}</div>
        <div style={{ color: C.muted, fontSize: '0.88rem', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}

// ── Main Component ──
export default function Landing() {
  useFonts()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erroForm, setErroForm] = useState('')

  // Counters
  const [statsRef, statsInView] = useInView(0.3)
  const c1 = useCounter(38, 1800, statsInView)
  const c2 = useCounter(84, 1800, statsInView)
  const c3 = useCounter(12, 1800, statsInView)

  async function enviarLead(e) {
    e.preventDefault()
    if (!nome.trim() || telefone.replace(/\D/g, '').length < 10) {
      setErroForm('Preencha nome e telefone válido.')
      return
    }
    setEnviando(true)
    try {
      await supabase.from('leads').insert([{ nome: nome.trim(), telefone: telefone.replace(/\D/g,''), convertido: false }])
    } catch {}
    setEnviando(false)
    setEnviado(true)
  }

  // ── Seção hero ──
  const H1_SIZE = isMobile ? '14vw' : '7.5vw'
  const HERO_COLS = isMobile ? '1fr' : '1fr 480px'

  return (
    <div className="lp-root">
      <style>{LP_STYLE}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 60px', height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', background: C.orange, borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/>
              <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
          </div>
          <span className="lp-bebas" style={{ fontSize: '1.4rem', color: C.text, letterSpacing: '0.08em' }}>
            ProduzFácil
          </span>
          <span style={{ color: C.muted, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginLeft: '2px' }}>CMV</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isMobile && (
            <a href={wppLink('nav')} target="_blank" rel="noopener noreferrer" className="lp-btn-outline" style={{ padding: '10px 20px', fontSize: '0.82rem' }}>
              Falar no WhatsApp
            </a>
          )}
          <button onClick={() => navigate('/login')} className="lp-btn-primary" style={{ padding: '10px 22px', fontSize: '0.82rem' }}>
            Acessar sistema
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: isMobile ? 'auto' : '100vh',
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '60px 24px 40px' : '80px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%', width: '700px', height: '700px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
          }} />
          {/* Grid lines */}
          <svg width="100%" height="100%" style={{ opacity: 0.04, position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke={C.text} strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div style={{ position: 'relative', width: '100%', display: 'grid', gridTemplateColumns: HERO_COLS, gap: isMobile ? '40px' : '60px', alignItems: 'center' }}>
          {/* Copy */}
          <div>
            <div className="lp-tag" style={{ marginBottom: '24px' }}>
              <span style={{ animation: 'lp-blink 1.2s step-end infinite', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', verticalAlign: 'middle', marginRight: '6px' }} />
              Beta gratuito disponível
            </div>

            <h1 className="lp-bebas" style={{ fontSize: H1_SIZE, color: C.text, marginBottom: '24px' }}>
              <span style={{ display: 'block' }}>PARE DE</span>
              <span style={{ display: 'block', color: C.orange }}>PERDER</span>
              <span style={{ display: 'block' }}>DINHEIRO</span>
              <span style={{ display: 'block', color: C.muted }}>NA COZINHA</span>
            </h1>

            <p style={{ color: C.muted, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 500, lineHeight: 1.7, maxWidth: '480px', marginBottom: '36px' }}>
              O ProduzFácil CMV controla o custo real de cada produção — peso cru, perdas, rendimento e custo por porção — em tempo real, sem planilhas.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <a href={wppLink('hero')} target="_blank" rel="noopener noreferrer" className="lp-btn-primary" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.86L.057 23.427a.75.75 0 0 0 .921.921l5.565-1.479A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.793-.538-5.362-1.473l-.384-.228-3.984 1.058 1.058-3.984-.228-.384A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Quero o beta grátis
              </a>
              <button onClick={() => navigate('/login')} className="lp-btn-outline">
                Já tenho acesso →
              </button>
            </div>

            {/* Social proof mini */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '28px' }}>
              <div style={{ display: 'flex' }}>
                {['#FF6A00','#FFAB00','#22C55E','#3B82F6'].map((c, i) => (
                  <div key={i} style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: c,
                    border: '2px solid #080604', marginLeft: i > 0 ? '-8px' : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 800, color: 'white',
                  }}>
                    {['C','M','V','R'][i]}
                  </div>
                ))}
              </div>
              <span style={{ color: C.muted, fontSize: '0.83rem', fontWeight: 500 }}>
                +40 cozinhas já controlam seus custos
              </span>
            </div>
          </div>

          {/* Dashboard mock */}
          <div style={{ animation: 'lp-float 4s ease-in-out infinite' }}>
            <DashMock />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: C.orange, padding: '14px 0', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', animation: 'lp-marquee 18s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {Array(2).fill(null).map((_, i) => (
            <span key={i} style={{ display: 'flex', gap: '0' }}>
              {['CONTROLE DE CUSTOS','PESO CRU','RENDIMENTO REAL','CMV PRECISO','CUSTO POR PORÇÃO','FORNECEDORES','HISTÓRICO','SEM PLANILHAS','DASHBOARD AO VIVO','COZINHA PROFISSIONAL'].map((t, j) => (
                <span key={j} style={{ color: 'white', fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0 28px' }}>
                  {t} <span style={{ opacity: 0.5 }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: isMobile ? '72px 24px' : '100px 60px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="lp-label">Resultados reais</div>
          <h2 className="lp-bebas" style={{ fontSize: isMobile ? '10vw' : '4.5vw', color: C.text }}>
            NÚMEROS QUE FAZEM SENTIDO
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '32px' : '2px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { num: c1, suffix: '%', label: 'Redução média de desperdício', desc: 'após 30 dias de uso' },
            { num: c2, suffix: '%', label: 'Precisão no rendimento', desc: 'calculado por lote real' },
            { num: c3, suffix: 'x', label: 'Mais rápido que planilhas', desc: 'no registro de produção' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: isMobile ? '0' : '40px 32px',
              borderRight: (!isMobile && i < 2) ? `1px solid ${C.border}` : 'none',
              textAlign: isMobile ? 'left' : 'center',
              display: isMobile ? 'flex' : 'block', gap: '24px', alignItems: 'flex-start',
            }}>
              <div className="lp-bebas" style={{ fontSize: isMobile ? '14vw' : '6vw', color: C.orange, lineHeight: 1, flexShrink: 0 }}>
                {s.num}{s.suffix}
              </div>
              <div>
                <div style={{ color: C.text, fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px', marginTop: isMobile ? '4px' : '12px' }}>{s.label}</div>
                <div style={{ color: C.muted, fontSize: '0.83rem' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={{ padding: isMobile ? '72px 24px' : '100px 60px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '40px' : '80px', alignItems: 'center' }}>
          <div>
            <div className="lp-label">O problema</div>
            <h2 className="lp-bebas" style={{ fontSize: isMobile ? '11vw' : '4.8vw', color: C.text, marginBottom: '24px' }}>
              SUA COZINHA GERA LUCRO OU SORTE?
            </h2>
            <p style={{ color: C.muted, fontSize: '1rem', lineHeight: 1.75, marginBottom: '24px' }}>
              A maioria dos cozinheiros não sabe o custo real de cada produção. Estimam na cabeça, usam planilhas ultrapassadas ou simplesmente ignoram — e perdem dinheiro todo dia.
            </p>
            <p style={{ color: C.muted, fontSize: '1rem', lineHeight: 1.75 }}>
              Frango com 30% de perda na limpeza cobra diferente de um com 18%. Sem controle, você precifica no escuro.
            </p>
          </div>

          {/* Pain cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: '📋', texto: '"Não sei quanto custa produzir um kg de frango pronto."' },
              { icon: '📉', texto: '"Cada fornecedor entrega um rendimento diferente, mas cobro o mesmo."' },
              { icon: '😰', texto: '"Uso planilha mas nunca está atualizada."' },
              { icon: '🔍', texto: '"Meu custo de porção é um chute."' },
            ].map((p, i) => (
              <div key={i} className="lp-card" style={{ padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{p.icon}</span>
                <p style={{ color: C.muted, fontSize: '0.9rem', lineHeight: 1.6, fontStyle: 'italic' }}>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ padding: isMobile ? '72px 24px' : '100px 60px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '60px' }}>
            <div className="lp-label">Como funciona</div>
            <h2 className="lp-bebas" style={{ fontSize: isMobile ? '11vw' : '4.8vw', color: C.text }}>
              DO PESO CRU AO<br />CUSTO POR PORÇÃO
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '32px' : '48px' }}>
            <StepCard num={1} icon="🔑" titulo="Funcionário faz login na cozinha" desc="Cada operador tem acesso próprio via PIN. Sem senhas complicadas, funciona em qualquer celular." />
            <StepCard num={2} icon="🥩" titulo="Registra o peso cru do lote" desc="Informa qual produto e fornecedor, pesagem inicial antes de qualquer processamento." />
            <StepCard num={3} icon="⚖️" titulo="Pesa após limpeza e após preparo" desc="O sistema calcula perda na limpeza, perda no preparo e rendimento final automaticamente." />
            <StepCard num={4} icon="📦" titulo="Informa ingredientes usados" desc="Adiciona temperos, marinadas e insumos. Tudo com custo cadastrado pelo administrativo." />
            <StepCard num={5} icon="📊" titulo="Sistema calcula o CMV completo" desc="Custo total, custo por kg pronto, custo por grama e custo da porção padrão — em segundos." />
            <StepCard num={6} icon="🖥️" titulo="Gestor vê tudo no dashboard" desc="Histórico de produções, ranking de fornecedores, tendências e alertas de desvio de meta." />
          </div>
        </div>
      </section>

      {/* ── COMPARAÇÃO ── */}
      <section style={{ padding: isMobile ? '72px 24px' : '100px 60px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="lp-label">ProduzFácil vs planilha</div>
            <h2 className="lp-bebas" style={{ fontSize: isMobile ? '10vw' : '4.2vw', color: C.text }}>
              A DIFERENÇA É CLARA
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '12px' : '20px' }}>
            {/* ProduzFácil */}
            <div className="lp-card" style={{ overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,106,0,0.12)', borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🍳</div>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: C.orange }}>ProduzFácil CMV</span>
              </div>
              {['Cálculo automático de perdas','Custo real por porção','Comparação entre fornecedores','Dashboard em tempo real','Acesso para funcionários','Histórico ilimitado','Sem planilha','Mobile-friendly'].map((t, i) => (
                <div key={i} style={{ padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: i < 7 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ color: C.green, flexShrink: 0 }}>✓</span>
                  <span style={{ color: C.text, fontSize: '0.82rem', fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Planilha */}
            <div className="lp-card">
              <div style={{ background: 'rgba(107,96,89,0.15)', borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#2A2218', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📊</div>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: C.muted }}>Planilha manual</span>
              </div>
              {['Precisa configurar fórmulas','Cálculo incompleto','Sem comparação automática','Atualização manual demorada','Não tem perfil de funcionário','Arquivo bagunçado com o tempo','Depende de treinamento','Péssimo no celular'].map((t, i) => (
                <div key={i} style={{ padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: i < 7 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ color: C.red, flexShrink: 0 }}>✗</span>
                  <span style={{ color: C.muted, fontSize: '0.82rem' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA COM FORM ── */}
      <section style={{ padding: isMobile ? '72px 24px' : '100px 60px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div className="lp-label">Acesso beta gratuito</div>
          <h2 className="lp-bebas" style={{ fontSize: isMobile ? '11vw' : '4.8vw', color: C.text, marginBottom: '16px' }}>
            COMECE HOJE,<br />SEM CUSTO
          </h2>
          <p style={{ color: C.muted, fontSize: '1rem', marginBottom: '36px' }}>
            Deixe seu contato e entraremos em toque pelo WhatsApp para liberar o acesso.
          </p>

          {enviado ? (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '32px', color: C.green }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>Recebemos seu contato!</div>
              <p style={{ color: C.muted, fontSize: '0.9rem' }}>Entraremos em toque pelo WhatsApp em breve.</p>
            </div>
          ) : (
            <form onSubmit={enviarLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                style={{
                  background: '#0f172a', border: `1px solid ${C.border}`, borderRadius: '8px',
                  padding: '16px 18px', color: C.text, fontSize: '1rem', fontFamily: 'Manrope, sans-serif',
                  outline: 'none', width: '100%',
                }}
              />
              <input
                type="tel"
                placeholder="WhatsApp (DDD + número)"
                value={telefone}
                onChange={e => setTelefone(formatarTelefone(e.target.value))}
                style={{
                  background: '#0f172a', border: `1px solid ${C.border}`, borderRadius: '8px',
                  padding: '16px 18px', color: C.text, fontSize: '1rem', fontFamily: 'Manrope, sans-serif',
                  outline: 'none', width: '100%',
                }}
              />
              {erroForm && <p style={{ color: C.red, fontSize: '0.82rem', textAlign: 'left' }}>{erroForm}</p>}
              <button type="submit" className="lp-btn-primary" disabled={enviando} style={{ width: '100%', justifyContent: 'center', fontSize: '1.05rem', padding: '18px' }}>
                {enviando ? 'Enviando...' : 'Quero o acesso beta grátis →'}
              </button>
              <p style={{ color: C.muted, fontSize: '0.75rem' }}>Sem spam. Entraremos em contato apenas 1x pelo WhatsApp.</p>
            </form>
          )}

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <a href={wppLink('cta')} target="_blank" rel="noopener noreferrer" className="lp-btn-outline" style={{ fontSize: '0.9rem' }}>
              Prefere falar agora pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: isMobile ? '72px 24px' : '100px 60px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div className="lp-label">Dúvidas frequentes</div>
            <h2 className="lp-bebas" style={{ fontSize: isMobile ? '10vw' : '4.2vw', color: C.text }}>PERGUNTAS & RESPOSTAS</h2>
          </div>
          <FaqItem pergunta="Preciso instalar alguma coisa?" resposta="Não. O ProduzFácil é 100% web. Funciona em qualquer navegador, no celular, tablet ou computador. Sem download, sem instalação." />
          <FaqItem pergunta="Quantos funcionários posso cadastrar?" resposta="No beta, sem limite de operadores. Cada um recebe seu próprio PIN de acesso e todas as produções ficam vinculadas ao funcionário responsável." />
          <FaqItem pergunta="Como funciona o acesso da cozinha?" resposta="O operador acessa uma página especial, escolhe o nome e digita o PIN de 4 dígitos. Nenhuma conta de e-mail necessária. Simples e rápido." />
          <FaqItem pergunta="E se eu mudar o preço de um insumo?" resposta="O administrativo atualiza o preço e todas as novas produções passam a usar o valor novo. As produções antigas ficam registradas com o custo do momento." />
          <FaqItem pergunta="Funciona em múltiplas cozinhas?" resposta="Sim. O sistema foi pensado para SaaS com múltiplas empresas. Cada unidade tem seus próprios dados, funcionários e dashboard separados." />
          <FaqItem pergunta="O beta vai ser pago algum dia?" resposta="Sim, mas quem entrar no beta terá condições especiais. Por agora, o acesso é completamente gratuito enquanto evoluímos o produto junto com vocês." />
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section style={{
        padding: isMobile ? '72px 24px' : '100px 60px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        borderTop: '1px solid #334155',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(249,115,22,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <h2 className="lp-bebas" style={{ fontSize: isMobile ? '12vw' : '5.5vw', color: '#f1f5f9', marginBottom: '20px', position: 'relative' }}>
          CHEGA DE PERDA.<br /><span style={{ color: '#f97316' }}>COMECE AGORA.</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '36px', position: 'relative' }}>
          O ProduzFácil CMV é gratuito no beta. Não perca a vaga.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
          <a href={wppLink('footer')} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#f97316',
              color: 'white', padding: '16px 32px', borderRadius: '8px', fontFamily: 'Manrope, sans-serif',
              fontWeight: 800, fontSize: '1rem', textDecoration: 'none', transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
            }}>
            Falar no WhatsApp
          </a>
          <button onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'transparent',
              color: '#94a3b8', padding: '16px 32px', borderRadius: '8px', fontFamily: 'Manrope, sans-serif',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer', border: '1.5px solid #334155',
              transition: 'all 0.2s',
            }}>
            Acessar sistema →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: isMobile ? '32px 24px' : '40px 60px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="lp-bebas" style={{ fontSize: '1.2rem', color: C.text, letterSpacing: '0.08em' }}>ProduzFácil</span>
          <span style={{ color: C.muted, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CMV</span>
        </div>
        <div style={{ color: C.muted, fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} ProduzFácil CMV. Controle real de cozinha.
        </div>
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}>
          Acessar sistema
        </button>
      </footer>
    </div>
  )
}
