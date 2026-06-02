import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const WPP = '5598991289090' // WhatsApp do responsável

function BtnWpp({ texto, origem }) {
  const msg = encodeURIComponent(`Olá! Vi o ProduzFácil CMV e quero saber mais sobre o beta gratuito. (${origem})`)
  return (
    <a href={`https://wa.me/${WPP}?text=${msg}`} target="_blank" rel="noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        background: '#25D366', color: 'white', fontWeight: 700,
        padding: '14px 28px', borderRadius: '10px', textDecoration: 'none',
        fontSize: '1rem', transition: 'opacity 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.86L.057 23.427a.75.75 0 0 0 .921.921l5.565-1.479A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.793-.538-5.362-1.473l-.384-.228-3.984 1.058 1.058-3.984-.228-.384A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
      {texto}
    </a>
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
    const { error } = await supabase.from('leads').insert({
      nome: form.nome, email: form.email,
      whatsapp: form.whatsapp, restaurante: form.restaurante,
      origem: 'landing_beta',
    })
    setEnviando(false)
    if (error) { setErro('Erro ao enviar. Tente pelo WhatsApp.'); return }
    setEnviado(true)
  }

  if (enviado) return (
    <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(34,197,94,0.1)', borderRadius: '16px', border: '2px solid #22c55e' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#22c55e', marginBottom: '8px' }}>Inscrição confirmada!</div>
      <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Entraremos em contato em breve com o seu acesso ao beta.</div>
    </div>
  )

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {erro && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem' }}>{erro}</div>}
      {[
        { key: 'nome', placeholder: 'Seu nome', type: 'text' },
        { key: 'restaurante', placeholder: 'Nome do restaurante / estabelecimento', type: 'text' },
        { key: 'email', placeholder: 'Seu melhor e-mail', type: 'email' },
        { key: 'whatsapp', placeholder: 'WhatsApp (com DDD)', type: 'tel' },
      ].map(f => (
        <input key={f.key} type={f.type} placeholder={f.placeholder} required
          value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
          style={{ padding: '14px 16px', borderRadius: '10px', border: '2px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: '1rem', fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#f97316'}
          onBlur={e => e.target.style.borderColor = '#334155'}
        />
      ))}
      <button type="submit" disabled={enviando} style={{
        background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white',
        fontWeight: 800, fontSize: '1.05rem', padding: '16px', borderRadius: '10px',
        border: 'none', cursor: 'pointer', transition: 'opacity 0.2s',
      }}>
        {enviando ? 'Enviando...' : '🚀 Quero entrar no beta gratuito'}
      </button>
      <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
        Sem cartão de crédito · Sem compromisso · Acesso em até 24h
      </div>
    </form>
  )
}

const dores = [
  { emoji: '😰', titulo: 'Você sabe quanto custa cada prato produzido?', desc: 'A maioria dos gestores tem uma estimativa. Mas estimativa não paga conta — e a diferença costuma ser prejuízo escondido.' },
  { emoji: '📉', titulo: 'Sua cozinha desperdiça e você não sabe onde', desc: 'Perda na limpeza, perda no preparo, variação de rendimento entre cozinheiros. Tudo isso come sua margem em silêncio.' },
  { emoji: '🤷', titulo: 'Fornecedor A ou B? Qual realmente compensa?', desc: 'Sem comparação real de preço × rendimento, você decide no achismo. E achismo em food cost é dinheiro no lixo.' },
]

const beneficios = [
  { emoji: '🎯', titulo: 'Custo real por porção', desc: 'Saiba exatamente quanto custa cada prato produzido, considerando perdas e ingredientes reais.' },
  { emoji: '📊', titulo: 'Diagnóstico automático', desc: 'O sistema identifica se o problema está na limpeza, no preparo ou no preço dos insumos — sem você precisar analisar nada.' },
  { emoji: '🔄', titulo: 'Comparação de fornecedores', desc: 'Veja qual fornecedor entrega mais rendimento pelo melhor preço, com dados reais das suas produções.' },
  { emoji: '📱', titulo: 'Simples para a equipe', desc: 'O cozinheiro registra em 2 minutos no celular. Sem planilha, sem treinamento longo, sem erro de digitação.' },
  { emoji: '📈', titulo: 'Histórico e tendências', desc: 'Acompanhe a evolução do custo, rendimento e desperdício ao longo do tempo com gráficos claros.' },
  { emoji: '🔒', titulo: 'Cada equipe vê só o que precisa', desc: 'Operador só registra produção. Gestor vê tudo. Sem risco de vazamento de custos para a equipe.' },
]

const faq = [
  { q: 'Preciso instalar algum aplicativo?', r: 'Não. O ProduzFácil funciona direto no navegador — computador, tablet ou celular. Sem instalação.' },
  { q: 'Minha equipe da cozinha consegue usar?', r: 'Sim. A interface do operador foi criada para ser simples e visual. Se ele sabe usar o WhatsApp, consegue registrar uma produção.' },
  { q: 'O beta é realmente gratuito?', r: 'Sim, 100% gratuito por 60 dias. Sem cartão de crédito. Sem cobrança surpresa. Em troca, pedimos feedback quinzenal.' },
  { q: 'O que acontece depois do beta?', r: 'Você recebe uma oferta exclusiva de early adopter com desconto permanente. Sem nenhuma obrigação de continuar.' },
  { q: 'Meus dados ficam seguros?', r: 'Sim. Os dados ficam armazenados no Supabase (infraestrutura AWS) com criptografia e backups automáticos.' },
  { q: 'Funciona para mais de um restaurante?', r: 'Sim. Cada unidade é independente, com dados separados. Gestão multi-unidade está no roadmap.' },
  { q: 'Posso cancelar quando quiser?', r: 'No beta não há contrato nem cobrança. Nos planos pagos futuros, cancelamento é imediato, sem multa.' },
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
            <a href={`https://wa.me/${WPP}?text=${encodeURIComponent('Olá! Quero saber mais sobre o beta do ProduzFácil CMV.')}`}
              target="_blank" rel="noreferrer"
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
      <section style={{ padding: '80px 24px 64px', textAlign: 'center', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
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
          <p style={{ fontSize: '0.82rem', color: '#475569' }}>
            Sem cartão de crédito · 60 dias grátis · Acesso em até 24h
          </p>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={{ padding: '72px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
              A realidade de quem gere uma cozinha profissional
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Se você se identificar com algum dos itens abaixo, o ProduzFácil foi feito para você.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {dores.map((d, i) => (
              <div key={i} style={{ background: '#1e293b', borderRadius: '14px', padding: '28px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{d.emoji}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '10px', lineHeight: 1.4 }}>{d.titulo}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUÇÃO ── */}
      <section style={{ padding: '72px 24px', background: '#1e293b' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, marginBottom: '16px' }}>
            O ProduzFácil <span style={{ color: '#f97316' }}>transforma produção em dado</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '700px', margin: '0 auto 48px' }}>
            O cozinheiro registra os pesos e ingredientes no celular. O sistema calcula automaticamente perda na limpeza, perda no preparo, rendimento, custo por porção e compara com o histórico — gerando diagnóstico em tempo real para o gestor.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
            {[
              { n: '1', t: 'Cozinheiro registra', d: 'Pesos + ingredientes em 2 min' },
              { n: '2', t: 'Sistema calcula', d: 'Custo, rendimento e perdas' },
              { n: '3', t: 'Gestor decide', d: 'Com dados reais, não achismo' },
            ].map(s => (
              <div key={s.n} style={{ background: '#0f172a', borderRadius: '12px', padding: '20px 16px', border: '1px solid #334155' }}>
                <div style={{ width: '36px', height: '36px', background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', margin: '0 auto 12px' }}>{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>{s.t}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ── */}
      <section style={{ padding: '72px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>
            O que você ganha com o ProduzFácil
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {beneficios.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
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

      {/* ── PROVA SOCIAL (placeholder) ── */}
      <section style={{ padding: '72px 24px', background: '#1e293b' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '12px' }}>
            Primeiros restaurantes já no beta
          </h2>
          <p style={{ color: '#64748b', marginBottom: '40px' }}>Seja um dos primeiros a validar o sistema e moldar o produto.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              { nome: 'Gustavo H.', cargo: 'Gestor de cozinha', texto: '"Finalmente consigo saber o custo real de cada produção. Antes era tudo no achismo."' },
              { nome: 'Em breve', cargo: 'Seu depoimento aqui', texto: 'Entre no beta e seja um dos primeiros a contar como o ProduzFácil transformou sua operação.' },
              { nome: 'Em breve', cargo: 'Seu depoimento aqui', texto: 'Entre no beta e seja um dos primeiros a contar como o ProduzFácil transformou sua operação.' },
            ].map((t, i) => (
              <div key={i} style={{ background: '#0f172a', borderRadius: '14px', padding: '24px', border: '1px solid #334155', textAlign: 'left' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>{t.texto}</p>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.nome}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t.cargo}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETA OFFER ── */}
      <section id="beta" style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(249,115,22,0.12)', color: '#f97316', fontWeight: 700, fontSize: '0.8rem', padding: '6px 16px', borderRadius: '20px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Beta gratuito — vagas limitadas
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 800, marginBottom: '12px' }}>
              Garanta seu acesso gratuito por 60 dias
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
      <section style={{ padding: '72px 24px', background: '#0f172a' }}>
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
              <div key={i} style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>{o.obj}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>{o.resp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS FUTUROS ── */}
      <section style={{ padding: '72px 24px', background: '#1e293b' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '12px' }}>Planos para após o beta</h2>
          <p style={{ color: '#64748b', marginBottom: '40px' }}>Durante o beta você usa tudo gratuitamente. Estes serão os planos ao final.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { nome: 'Starter', preco: 'R$ 97', periodo: '/mês', desc: '1 unidade · Até 5 operadores · Dashboard completo · Suporte por e-mail', destaque: false },
              { nome: 'Pro', preco: 'R$ 197', periodo: '/mês', desc: '1 unidade · Operadores ilimitados · Diagnóstico automático · Suporte prioritário', destaque: true },
              { nome: 'Multi', preco: 'R$ 397', periodo: '/mês', desc: 'Múltiplas unidades · Tudo do Pro · Gestão centralizada · Onboarding dedicado', destaque: false },
            ].map((p, i) => (
              <div key={i} style={{ background: p.destaque ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#0f172a', borderRadius: '16px', padding: '28px', border: p.destaque ? 'none' : '1px solid #334155', position: 'relative' }}>
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
      <section style={{ padding: '72px 24px', background: '#0f172a' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, textAlign: 'center', marginBottom: '40px' }}>Perguntas frequentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faq.map((f, i) => (
              <FaqItem key={i} q={f.q} r={f.r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', textAlign: 'center' }}>
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
      <a href={`https://wa.me/${WPP}?text=${encodeURIComponent('Olá! Tenho interesse no ProduzFácil CMV.')}`}
        target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(37,211,102,0.4)', zIndex: 999, transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.86L.057 23.427a.75.75 0 0 0 .921.921l5.565-1.479A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.793-.538-5.362-1.473l-.384-.228-3.984 1.058 1.058-3.984-.228-.384A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
      </a>
    </div>
  )
}

function FaqItem({ q, r }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
      <button onClick={() => setAberto(!aberto)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', gap: '12px' }}>
        {q}
        <span style={{ fontSize: '1.2rem', color: '#f97316', flexShrink: 0, transition: 'transform 0.2s', transform: aberto ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {aberto && <div style={{ padding: '0 20px 16px', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>{r}</div>}
    </div>
  )
}
