import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const WPP = '5598991289090'

const ICONE_WPP = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.86L.057 23.427a.75.75 0 0 0 .921.921l5.565-1.479A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.793-.538-5.362-1.473l-.384-.228-3.984 1.058 1.058-3.984-.228-.384A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

function wppLink(origem) {
  const msg = encodeURIComponent(`Olá! Vi o ProduzFácil CMV e quero saber mais sobre o beta gratuito. (${origem})`)
  return `https://wa.me/${WPP}?text=${msg}`
}

function BtnWpp({ texto, origem, full }) {
  return (
    <a href={wppLink(origem)} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      background: '#25D366', color: 'white', fontWeight: 700,
      padding: '14px 28px', borderRadius: '10px', textDecoration: 'none',
      fontSize: '1rem', transition: 'opacity 0.2s',
      width: full ? '100%' : 'auto',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {ICONE_WPP} {texto}
    </a>
  )
}

// Formata telefone brasileiro: (XX) XXXXX-XXXX
function formatarTelefone(valor) {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2)  return nums
  if (nums.length <= 7)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 11) return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
  return valor
}

function ConfirmacaoInscricao({ nome }) {
  const primeiroNome = nome.split(' ')[0]
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#22c55e', marginBottom: '8px' }}>
        {primeiroNome}, sua vaga está garantida!
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '16px' }}>
        Enviamos um <strong style={{ color: '#f1f5f9' }}>link de acesso para o seu e-mail</strong>. Clique nele para confirmar sua inscrição e entrar no sistema.
      </p>

      {/* Aviso spam */}
      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left' }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
        <div style={{ fontSize: '0.85rem', color: '#fcd34d', lineHeight: 1.6 }}>
          <strong>Verifique o spam!</strong> Nosso e-mail pode cair na caixa de spam ou no lixo eletrônico. Se não aparecer na caixa de entrada em alguns minutos, confira lá.
        </div>
      </div>

      {/* Próximos passos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '28px' }}>
        {[
          { n: '1', emoji: '📧', titulo: 'Clique no link no e-mail', desc: 'Acabamos de enviar um link de acesso para o seu e-mail. Clique nele para confirmar e entrar. Não chegou? Confira o spam.' },
          { n: '2', emoji: '📱', titulo: 'Entre no grupo beta', desc: 'Você receberá o link do grupo exclusivo de beta testadores no WhatsApp.' },
          { n: '3', emoji: '🚀', titulo: 'Acesse e explore', desc: 'Use o sistema por 30 dias gratuitamente e registre suas primeiras produções.' },
          { n: '4', emoji: '💬', titulo: 'Dê seu feedback', desc: 'A cada 15 dias enviaremos um formulário rápido. Seu feedback molda o produto.' },
        ].map(p => (
          <div key={p.n} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px 16px', border: '1px solid #334155' }}>
            <div style={{ width: '32px', height: '32px', background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{p.n}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>{p.emoji} {p.titulo}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
        Quer acelerar? Fale diretamente com a gente agora:
      </p>
      <BtnWpp texto="Falar no WhatsApp agora" origem="pos_inscricao" full />
    </div>
  )
}

function FormBeta() {
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', restaurante: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    // 1. Salva o lead na tabela
    const { error } = await supabase.from('leads').insert({
      nome: form.nome, email: form.email,
      whatsapp: form.whatsapp, restaurante: form.restaurante,
      origem: 'landing_beta',
    })
    if (error) { setEnviando(false); setErro('Erro ao enviar. Tente pelo WhatsApp.'); return }

    // 2. Cria conta no Supabase Auth com senha temporária aleatória
    // Isso dispara o e-mail "Confirm sign up" com o template personalizado — igual ao Loveable
    // BASE_URL = '/produz-facil/' em produção, '/' em dev
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    const redirectUrl = `${window.location.origin}${base}/login`
    const senhaTemp = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase() + '!9'
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: senhaTemp,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome: form.nome },
      },
    })

    setEnviando(false)

    if (signUpError) {
      // Usuário já cadastrado — envia novo link de confirmação via OTP
      if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('user already')) {
        await supabase.auth.signInWithOtp({
          email: form.email,
          options: { emailRedirectTo: redirectUrl },
        })
      } else {
        setErro(`Erro ao enviar e-mail: ${signUpError.message}. Tente pelo WhatsApp.`)
        return
      }
    }

    setEnviado(true)
  }

  if (enviado) return <ConfirmacaoInscricao nome={form.nome || 'Olá'} />

  const inputStyle = {
    padding: '14px 16px', borderRadius: '10px', border: '2px solid #334155',
    background: '#1e293b', color: '#f1f5f9', fontSize: '1rem',
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {erro && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem' }}>{erro}</div>}
      <input style={inputStyle} type="text" placeholder="Seu nome completo" required
        value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
        onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#334155'} />
      <input style={inputStyle} type="text" placeholder="Nome do restaurante / estabelecimento" required
        value={form.restaurante} onChange={e => setForm(p => ({ ...p, restaurante: e.target.value }))}
        onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#334155'} />
      <input style={inputStyle} type="email" placeholder="Seu melhor e-mail" required
        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
        onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#334155'} />
      <input style={inputStyle} type="tel" placeholder="WhatsApp: (XX) XXXXX-XXXX" required
        value={form.whatsapp}
        onChange={e => setForm(p => ({ ...p, whatsapp: formatarTelefone(e.target.value) }))}
        onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#334155'} />
      <button type="submit" disabled={enviando} style={{
        background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white',
        fontWeight: 800, fontSize: '1.05rem', padding: '16px', borderRadius: '10px',
        border: 'none', cursor: 'pointer', transition: 'opacity 0.2s',
        opacity: enviando ? 0.7 : 1,
      }}>
        {enviando ? 'Enviando...' : '🚀 Quero entrar no beta gratuito'}
      </button>
      <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
        Sem cartão de crédito · Sem compromisso · Acesso em até 24h
      </div>
    </form>
  )
}

// Marquee de benefícios
const MARQUEE_ITENS = [
  '✅ Custo real por porção', '📉 Menos desperdício', '📊 Dashboard gerencial',
  '🔍 Diagnóstico automático', '🔄 Compare fornecedores', '📱 Simples para a cozinha',
  '💰 Controle de CMV', '📋 Ficha técnica digital', '🏆 Metas de rendimento',
  '⚡ Registro em 2 minutos', '🧂 Escala automática de receitas', '🎯 Decisões com dados reais',
]

function Marquee() {
  const itens = [...MARQUEE_ITENS, ...MARQUEE_ITENS]
  return (
    <div style={{ overflow: 'hidden', background: '#f97316', padding: '12px 0', width: '100%' }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { display: flex; gap: 0; animation: marquee 28s linear infinite; width: max-content; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="marquee-track">
        {itens.map((item, i) => (
          <span key={i} style={{ padding: '0 28px', color: 'white', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.3)' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

const dores = [
  { emoji: '😰', titulo: 'Você sabe quanto custa cada prato produzido?', desc: 'A maioria dos gestores tem uma estimativa. Mas estimativa não paga conta — e a diferença costuma ser prejuízo escondido.' },
  { emoji: '📉', titulo: 'Sua cozinha desperdiça e você não sabe onde', desc: 'Perda na limpeza, perda no preparo, variação de rendimento entre cozinheiros. Tudo isso come sua margem em silêncio.' },
  { emoji: '🤷', titulo: 'Fornecedor A ou B? Qual realmente compensa?', desc: 'Sem comparação real de preço × rendimento, você decide no achismo. E achismo em food cost é dinheiro no lixo.' },
]

const beneficios = [
  { emoji: '🎯', titulo: 'Custo real por porção', desc: 'Saiba exatamente quanto custa cada prato, considerando perdas e ingredientes reais.' },
  { emoji: '📊', titulo: 'Diagnóstico automático', desc: 'O sistema identifica se o problema está na limpeza, no preparo ou no preço dos insumos.' },
  { emoji: '🔄', titulo: 'Comparação de fornecedores', desc: 'Veja qual fornecedor entrega mais rendimento pelo melhor preço, com dados reais.' },
  { emoji: '📱', titulo: 'Simples para a equipe', desc: 'O cozinheiro registra em 2 minutos no celular. Sem planilha, sem treinamento longo.' },
  { emoji: '📈', titulo: 'Histórico e tendências', desc: 'Acompanhe custo, rendimento e desperdício ao longo do tempo com gráficos claros.' },
  { emoji: '🔒', titulo: 'Cada equipe vê só o que precisa', desc: 'Operador só registra produção. Gestor vê tudo. Seus custos protegidos.' },
]

const faq = [
  { q: 'Preciso instalar algum aplicativo?', r: 'Não. O ProduzFácil funciona direto no navegador — computador, tablet ou celular.' },
  { q: 'Minha equipe da cozinha consegue usar?', r: 'Sim. A interface do operador tem 4 etapas visuais simples. Se ele usa WhatsApp, usa o ProduzFácil.' },
  { q: 'O beta é realmente gratuito?', r: 'Sim, 100% gratuito por 30 dias. Sem cartão de crédito. Sem cobrança surpresa.' },
  { q: 'O que acontece depois do beta?', r: 'Você recebe uma oferta exclusiva de early adopter com desconto permanente. Sem obrigação de continuar.' },
  { q: 'Meus dados ficam seguros?', r: 'Sim. Armazenados no Supabase (infraestrutura AWS) com criptografia e backups automáticos.' },
  { q: 'Funciona para mais de um restaurante?', r: 'Sim. Cada unidade é independente com dados separados.' },
  { q: 'Posso cancelar quando quiser?', r: 'No beta não há contrato nem cobrança. Cancele a qualquer momento, sem multa.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1e293b', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f97316' }}>
            ProduzFácil <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.85rem' }}>CMV</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href={wppLink('header')} target="_blank" rel="noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              Fale conosco
            </a>
            <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: '2px solid #f97316', color: '#f97316', fontWeight: 700, padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: '80px 24px 0', textAlign: 'center', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(249,115,22,0.12)', color: '#f97316', fontWeight: 700, fontSize: '0.8rem', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🔥 Beta gratuito — vagas limitadas
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '20px' }}>
            Descubra quanto custa{' '}
            <span style={{ color: '#f97316' }}>cada prato que sai da sua cozinha</span>
            {' '}— sem planilha, sem achismo
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#94a3b8', lineHeight: 1.7, marginBottom: '36px', maxWidth: '620px', margin: '0 auto 36px' }}>
            O ProduzFácil CMV calcula o custo real por porção, identifica onde sua cozinha perde dinheiro e compara fornecedores automaticamente — tudo pelo celular.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button onClick={() => document.getElementById('beta').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', fontWeight: 800, fontSize: '1.05rem', padding: '16px 32px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              🚀 Quero o acesso beta gratuito
            </button>
            <BtnWpp texto="Tirar dúvidas no WhatsApp" origem="hero" />
          </div>
          <p style={{ fontSize: '0.82rem', color: '#475569', paddingBottom: '48px' }}>
            Sem cartão de crédito · 30 dias grátis · Acesso em até 24h
          </p>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <Marquee />

      {/* ── ANTES × DEPOIS ── */}
      <section style={{ padding: '72px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>
            A diferença que o controle real faz
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Antes */}
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                😓 Antes do ProduzFácil
              </div>
              {[
                'Custo por prato? "Acho que é uns R$ X..."',
                'Perda na cozinha é descoberta só no estoque',
                'Decide fornecedor pelo preço da nota, não pelo rendimento real',
                'Cozinheiro preenche planilha errada ou não preenche',
                'Não sabe qual turno ou cozinheiro está desperdiçando mais',
                'Prejuízo aparece no caixa, mas a causa é um mistério',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }}>✕</span> {item}
                </div>
              ))}
            </div>

            {/* Depois */}
            <div style={{ background: 'rgba(34,197,94,0.07)', border: '2px solid rgba(34,197,94,0.3)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#22c55e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                😎 Com o ProduzFácil
              </div>
              {[
                'Custo real por porção atualizado a cada produção',
                'Sistema alerta quando a perda está acima do histórico',
                'Comparação de fornecedor com dados reais de rendimento',
                'Cozinheiro registra em 2 min no celular — sem erro',
                'Dashboard mostra qual produto e qual problema em primeiro lugar',
                'Decisão baseada em dado, não em estimativa',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <span style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={{ padding: '72px 24px', background: '#1e293b' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
              Reconhece alguma dessas situações?
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Se sim, o ProduzFácil foi feito para você.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {dores.map((d, i) => (
              <div key={i} style={{ background: '#0f172a', borderRadius: '14px', padding: '28px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{d.emoji}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '10px', lineHeight: 1.4 }}>{d.titulo}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUÇÃO ── */}
      <section style={{ padding: '72px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, marginBottom: '16px' }}>
            O ProduzFácil <span style={{ color: '#f97316' }}>transforma produção em dado</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '700px', margin: '0 auto 48px' }}>
            O cozinheiro registra pesos e ingredientes no celular. O sistema calcula automaticamente perda, rendimento, custo por porção e gera diagnóstico em tempo real para o gestor.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
            {[
              { n: '1', t: 'Cozinheiro registra', d: 'Pesos + ingredientes em 2 min' },
              { n: '2', t: 'Sistema calcula', d: 'Custo, rendimento e perdas' },
              { n: '3', t: 'Gestor decide', d: 'Com dados reais, não achismo' },
            ].map(s => (
              <div key={s.n} style={{ background: '#1e293b', borderRadius: '12px', padding: '20px 16px', border: '1px solid #334155' }}>
                <div style={{ width: '36px', height: '36px', background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', margin: '0 auto 12px' }}>{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>{s.t}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ── */}
      <section style={{ padding: '72px 24px', background: '#1e293b' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>
            O que você ganha com o ProduzFácil
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {beneficios.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: '#0f172a', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{b.emoji}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>{b.titulo}</div>
                  <div style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETA OFFER ── */}
      <section id="beta" style={{ padding: '80px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(249,115,22,0.12)', color: '#f97316', fontWeight: 700, fontSize: '0.8rem', padding: '6px 16px', borderRadius: '20px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Beta gratuito — vagas limitadas
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 800, marginBottom: '12px' }}>
              Garanta seu acesso gratuito por 30 dias
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Em troca, pedimos apenas seu feedback quinzenal. Ao final, você recebe desconto exclusivo de early adopter.
            </p>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '32px', border: '2px solid #f97316' }}>
            <FormBeta />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <BtnWpp texto="Prefiro falar pelo WhatsApp" origem="beta_section" />
          </div>
        </div>
      </section>

      {/* ── QUEBRA DE OBJEÇÕES ── */}
      <section style={{ padding: '72px 24px', background: '#1e293b' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>
            Ainda com dúvidas? Entendemos.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {[
              { obj: '"Minha equipe não vai saber usar."', resp: 'A tela do cozinheiro tem 4 etapas visuais. Se ele usa WhatsApp, usa o ProduzFácil.' },
              { obj: '"Não tenho tempo para implantar."', resp: 'Cadastro em 15 minutos. Primeiro registro em menos de 5 minutos. Sem instalação.' },
              { obj: '"Já uso planilha, funciona."', resp: 'Planilha não detecta onde está o problema nem gera diagnóstico automático. E cozinheiro não preenche planilha direito.' },
              { obj: '"E se eu não gostar?"', resp: 'No beta não há contrato nem cobrança. Cancele quando quiser, sem precisar explicar nada.' },
            ].map((o, i) => (
              <div key={i} style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>{o.obj}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>{o.resp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS FUTUROS ── */}
      <section style={{ padding: '72px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '12px' }}>Planos para após o beta</h2>
          <p style={{ color: '#64748b', marginBottom: '40px' }}>Durante o beta você usa tudo gratuitamente. Estes serão os planos ao final.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { nome: 'Starter', preco: 'R$ 97', periodo: '/mês', desc: '1 unidade · Até 5 operadores · Dashboard completo · Suporte por e-mail', destaque: false },
              { nome: 'Pro', preco: 'R$ 197', periodo: '/mês', desc: '1 unidade · Operadores ilimitados · Diagnóstico automático · Suporte prioritário', destaque: true },
              { nome: 'Multi', preco: 'R$ 397', periodo: '/mês', desc: 'Múltiplas unidades · Tudo do Pro · Gestão centralizada · Onboarding dedicado', destaque: false },
            ].map((p, i) => (
              <div key={i} style={{ background: p.destaque ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1e293b', borderRadius: '16px', padding: '28px', border: p.destaque ? 'none' : '1px solid #334155', position: 'relative' }}>
                {p.destaque && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#fbbf24', color: '#1e293b', fontWeight: 800, fontSize: '0.75rem', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>MAIS POPULAR</div>}
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>{p.nome}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>{p.preco}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '16px' }}>{p.periodo}</div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.7, opacity: 0.9 }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '20px' }}>
            ⭐ Participantes do beta recebem desconto permanente de early adopter
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '72px 24px', background: '#1e293b' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '40px' }}>Perguntas frequentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faq.map((f, i) => <FaqItem key={i} q={f.q} r={f.r} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '80px 24px', background: '#0f172a', textAlign: 'center' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, marginBottom: '16px' }}>
            Pare de perder margem sem saber por quê
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, marginBottom: '32px' }}>
            Cada produção sem controle é dinheiro que sai sem deixar rastro. Comece agora, gratuitamente.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('beta').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', fontWeight: 800, fontSize: '1.05rem', padding: '16px 32px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              🚀 Garantir meu acesso gratuito
            </button>
            <BtnWpp texto="Falar no WhatsApp" origem="cta_final" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '24px', borderTop: '1px solid #1e293b', textAlign: 'center' }}>
        <div style={{ color: '#334155', fontSize: '0.82rem' }}>
          © 2026 ProduzFácil CMV · Todos os direitos reservados
        </div>
      </footer>

      {/* ── BOTÃO WPP FLUTUANTE ── */}
      <a href={wppLink('floating')} target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(37,211,102,0.4)', zIndex: 999, transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {ICONE_WPP}
      </a>
    </div>
  )
}

function FaqItem({ q, r }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ background: '#0f172a', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
      <button onClick={() => setAberto(!aberto)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', gap: '12px' }}>
        {q}
        <span style={{ fontSize: '1.2rem', color: '#f97316', flexShrink: 0, transition: 'transform 0.2s', transform: aberto ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {aberto && <div style={{ padding: '0 20px 16px', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>{r}</div>}
    </div>
  )
}
