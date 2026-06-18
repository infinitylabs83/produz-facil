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
  muted:   '#94a3b8',
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

// ── iPhone mockup com tela real do app (produção mobile) ──
function IphoneMock() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', animation: 'lp-float 4s ease-in-out infinite' }}>
      {/* Corpo do iPhone */}
      <div style={{
        width: '260px', background: '#1a1a1a', borderRadius: '44px',
        padding: '14px', boxShadow: '0 0 0 1px #333, 0 0 0 3px #1a1a1a, 0 0 0 4px #444, 0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(249,115,22,0.15)',
        position: 'relative',
      }}>
        {/* Botões laterais (decorativos) */}
        <div style={{ position: 'absolute', left: '-4px', top: '100px', width: '4px', height: '32px', background: '#333', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-4px', top: '142px', width: '4px', height: '32px', background: '#333', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', right: '-4px', top: '120px', width: '4px', height: '48px', background: '#333', borderRadius: '0 2px 2px 0' }} />

        {/* Tela */}
        <div style={{
          background: '#f8fafc', borderRadius: '32px', overflow: 'hidden',
          fontFamily: 'Manrope, sans-serif', height: '520px', display: 'flex', flexDirection: 'column',
        }}>
          {/* Status bar */}
          <div style={{ background: '#1e293b', padding: '10px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>9:41</span>
            {/* Notch dinâmica */}
            <div style={{ width: '70px', height: '18px', background: '#1a1a1a', borderRadius: '0 0 12px 12px', position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '14px' }} />
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="white"><rect x="0" y="4" width="2" height="6" rx="1"/><rect x="3" y="2" width="2" height="8" rx="1"/><rect x="6" y="0" width="2" height="10" rx="1"/><rect x="9" y="1" width="2" height="9" rx="1"/></svg>
              <svg width="12" height="10" viewBox="0 0 24 12" fill="white"><rect x="0" y="2" width="20" height="8" rx="2"/><rect x="21" y="4" width="3" height="4" rx="1"/><rect x="1" y="3" width="14" height="6" rx="1" fill="#f97316"/></svg>
            </div>
          </div>

          {/* App top bar */}
          <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', background: '#f97316', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <span style={{ color: '#f97316', fontSize: '0.7rem', fontWeight: 800 }}>ProduzFácil</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem', fontWeight: 600 }}>🚪 Sair</span>
          </div>

          {/* Conteúdo */}
          <div style={{ flex: 1, overflowY: 'hidden', padding: '14px', background: '#f8fafc' }}>
            {/* Steps */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.55rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: n < 3 ? '#f97316' : n === 3 ? '#f97316' : '#e2e8f0',
                    color: n <= 3 ? 'white' : '#94a3b8',
                  }}>
                    {n < 3 ? '✓' : n}
                  </div>
                  {n < 4 && <div style={{ width: '18px', height: '2px', background: n < 3 ? '#f97316' : '#e2e8f0', borderRadius: '1px' }} />}
                </div>
              ))}
            </div>

            <div style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Etapa 3 de 4 — Pesagens</div>
            <div style={{ color: '#1e293b', fontSize: '0.85rem', fontWeight: 800, marginBottom: '14px' }}>🥩 Frango Grelhado</div>

            {/* Inputs */}
            {[
              { label: 'Peso cru', value: '12,5 kg', done: true },
              { label: 'Após limpeza', value: '10,2 kg', done: true },
              { label: 'Peso final pronto', value: '8,8 kg', done: false, active: true },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                <div style={{
                  padding: '9px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                  background: f.active ? 'white' : f.done ? 'rgba(34,197,94,0.08)' : '#f1f5f9',
                  border: f.active ? '2px solid #f97316' : f.done ? '1px solid rgba(34,197,94,0.3)' : '1px solid #e2e8f0',
                  color: f.done ? '#166534' : '#1e293b', display: 'flex', justifyContent: 'space-between',
                }}>
                  {f.value}
                  {f.done && <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>✓</span>}
                  {f.active && <span style={{ color: '#f97316', fontSize: '0.65rem', fontWeight: 600 }}>kg</span>}
                </div>
              </div>
            ))}

            {/* Alert card */}
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '8px 10px', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.9rem' }}>✅</span>
              <div>
                <div style={{ color: '#166534', fontSize: '0.6rem', fontWeight: 800 }}>Rendimento: 84,2%</div>
                <div style={{ color: '#15803d', fontSize: '0.55rem' }}>Dentro da meta (≥ 80%)</div>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{ background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', flexShrink: 0 }}>
            {[{i:'📊',l:'Dashboard'},{i:'🍖',l:'Produção'},{i:'📅',l:'Histórico'},{i:'📋',l:'Cadastros'}].map((item, idx) => (
              <div key={idx} style={{
                flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                borderTop: idx === 1 ? '2px solid #f97316' : '2px solid transparent',
                color: idx === 1 ? '#f97316' : '#94a3b8',
              }}>
                <span style={{ fontSize: '0.9rem' }}>{item.i}</span>
                <span style={{ fontSize: '0.45rem', fontWeight: 700 }}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Home bar */}
        <div style={{ height: '6px', width: '80px', background: '#444', borderRadius: '3px', margin: '10px auto 0' }} />
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
                    border: '2px solid #0f172a', marginLeft: i > 0 ? '-8px' : 0,
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

          {/* iPhone mockup */}
          <IphoneMock />
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
              <div style={{ background: 'rgba(249,115,22,0.12)', borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: C.orange }}>ProduzFácil CMV</span>
              </div>
              {['Cálculo automático de perdas','Custo real por porção','Comparação entre fornecedores','Dashboard em tempo real','Acesso para funcionários','Histórico ilimitado','Sem planilha','Mobile-friendly'].map((t, i) => (
                <div key={i} style={{ padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: i < 7 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ color: C.green, flexShrink: 0, fontWeight: 800 }}>✓</span>
                  <span style={{ color: C.text, fontSize: '0.95rem', fontWeight: 600 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Planilha */}
            <div className="lp-card">
              <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#94a3b8' }}>Planilha manual</span>
              </div>
              {['Precisa configurar fórmulas','Cálculo incompleto','Sem comparação automática','Atualização manual demorada','Não tem perfil de funcionário','Arquivo bagunçado com o tempo','Depende de treinamento','Péssimo no celular'].map((t, i) => (
                <div key={i} style={{ padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: i < 7 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ color: C.red, flexShrink: 0, fontWeight: 800 }}>✗</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section style={{ padding: isMobile ? '72px 24px' : '100px 60px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div className="lp-label">Planos</div>
            <h2 className="lp-bebas" style={{ fontSize: isMobile ? '10vw' : '4.2vw', color: C.text, marginBottom: '14px' }}>
              EM BREVE: LANÇAMENTO OFICIAL
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 48px' }}>
              O produto está em beta gratuito. Aproveite agora para garantir o acesso de <strong style={{ color: C.text }}>Membro Fundador</strong> — preço especial bloqueado para sempre.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '20px' }}>
            {/* Gratuito */}
            <div className="lp-card" style={{ padding: '28px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Atual — Beta</div>
              <div className="lp-bebas" style={{ fontSize: '2.8rem', color: C.text, lineHeight: 1, marginBottom: '4px' }}>Grátis</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>enquanto durar o beta</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {['1 empresa','Produções ilimitadas','Dashboard básico','Acesso para funcionários'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: C.green, fontSize: '0.85rem' }}>✓</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={wppLink('plano-beta')} target="_blank" rel="noopener noreferrer" style={{
                display: 'block', textAlign: 'center', padding: '13px', borderRadius: '8px',
                border: `1.5px solid ${C.border}`, color: '#94a3b8', fontWeight: 700,
                fontSize: '0.9rem', textDecoration: 'none', transition: 'all 0.2s',
              }}>
                Acessar agora (grátis)
              </a>
            </div>

            {/* Fundador — destaque */}
            <div style={{
              background: 'linear-gradient(145deg, #1e3a5f 0%, #1e293b 100%)',
              border: `2px solid ${C.orange}`, borderRadius: '12px', padding: '28px',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 40px rgba(249,115,22,0.2)',
            }}>
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: C.orange, color: 'white', fontSize: '0.6rem', fontWeight: 900,
                padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                🔥 Aproveite já
              </div>
              <div style={{ color: C.orange, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Membro Fundador</div>
              <div className="lp-bebas" style={{ fontSize: '2.8rem', color: C.text, lineHeight: 1 }}>R$ 79</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>/mês — preço bloqueado</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '24px', fontStyle: 'italic' }}>
                ⚡ Após o lançamento, sobe para R$ 149/mês
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {['Tudo do plano gratuito','Relatórios avançados de CMV','Comparação entre fornecedores','Alertas de desvio de meta','Suporte prioritário por WhatsApp','Badge exclusivo de Fundador','Preço nunca aumenta'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: C.orange, fontSize: '0.85rem' }}>✓</span>
                    <span style={{ color: C.text, fontSize: '0.9rem', fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={wppLink('plano-fundador')} target="_blank" rel="noopener noreferrer" className="lp-btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Quero ser Fundador →
              </a>
            </div>

            {/* Pro — em breve */}
            <div className="lp-card" style={{ padding: '28px', opacity: 0.6 }}>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Em breve</div>
              <div className="lp-bebas" style={{ fontSize: '2.8rem', color: C.text, lineHeight: 1, marginBottom: '4px' }}>Pro</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>para redes e franquias</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {['Múltiplas unidades','BI e análises avançadas','API e integrações','Gestor multiempresa','SLA garantido'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontSize: '0.85rem' }}>○</span>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{
                display: 'block', textAlign: 'center', padding: '13px', borderRadius: '8px',
                border: `1.5px solid ${C.border}`, color: '#475569', fontWeight: 700, fontSize: '0.9rem',
              }}>
                Em breve
              </div>
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

      {/* ── BOTÃO FLUTUANTE WHATSAPP ── */}
      <a href={wppLink('floating')} target="_blank" rel="noopener noreferrer" style={{
        position: 'fixed', bottom: '28px', right: '28px', zIndex: 999,
        width: '56px', height: '56px', borderRadius: '50%', background: '#25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37,211,102,0.5)', textDecoration: 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,211,102,0.65)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.5)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.86L.057 23.427a.75.75 0 0 0 .921.921l5.565-1.479A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.793-.538-5.362-1.473l-.384-.228-3.984 1.058 1.058-3.984-.228-.384A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      </a>

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
