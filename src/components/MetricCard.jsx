export default function MetricCard({ titulo, valor, subtexto, cor }) {
  const estiloDestaque = cor ? { borderTop: `4px solid ${cor}` } : {}

  return (
    <div className="card" style={estiloDestaque}>
      <div className="card-titulo">{titulo}</div>
      <div className="card-valor">{valor}</div>
      {subtexto && <div className="card-subtexto">{subtexto}</div>}
    </div>
  )
}
