// MetricCard com suporte a sparkline e tendência
export default function MetricCard({ titulo, valor, subtexto, cor, sparkline, tendencia }) {
  const estiloDestaque = cor ? { borderTop: `3px solid ${cor}` } : {}

  // Calcula SVG sparkline a partir de array de números
  function renderSparkline(dados) {
    if (!dados || dados.length < 2) return null
    const w = 80, h = 28, pad = 2
    const min = Math.min(...dados)
    const max = Math.max(...dados)
    const range = max - min || 1
    const pts = dados.map((v, i) => {
      const x = pad + (i / (dados.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / range) * (h - pad * 2)
      return `${x},${y}`
    }).join(' ')
    const ultimo = dados[dados.length - 1]
    const penultimo = dados[dados.length - 2]
    const subindo = ultimo >= penultimo
    const cor = subindo ? '#22c55e' : '#ef4444'
    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Ponto final */}
        {(() => {
          const [x, y] = pts.split(' ').at(-1).split(',')
          return <circle cx={x} cy={y} r="3" fill={cor} />
        })()}
      </svg>
    )
  }

  const tendenciaCor = tendencia > 0 ? '#22c55e' : tendencia < 0 ? '#ef4444' : '#94a3b8'
  const tendenciaIcon = tendencia > 0 ? '↑' : tendencia < 0 ? '↓' : '→'

  return (
    <div className="card" style={{ ...estiloDestaque, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div className="card-titulo">{titulo}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div className="card-valor">{valor}</div>
          {subtexto && <div className="card-subtexto">{subtexto}</div>}
          {tendencia !== undefined && tendencia !== null && (
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: tendenciaCor, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{tendenciaIcon}</span>
              <span>{Math.abs(tendencia).toFixed(1)}% vs anterior</span>
            </div>
          )}
        </div>
        {sparkline && <div style={{ flexShrink: 0, opacity: 0.8 }}>{renderSparkline(sparkline)}</div>}
      </div>
    </div>
  )
}
