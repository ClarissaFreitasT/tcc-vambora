import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function RoteiroDetalhes() {
  const { id } = useParams()
  const [roteiro, setRoteiro] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:3000/roteiros/${id}`)
      .then((r) => r.json())
      .then(setRoteiro)
      .catch(() => setRoteiro(null))
  }, [id])

  if (!roteiro) return <main className="container" style={{ paddingBlock: 40 }}>Carregando roteiro...</main>

  return (
    <main className="container" style={{ paddingBlock: 40 }}>
      <h2>{roteiro.titulo} — {roteiro.destino}</h2>
      <p style={{ color: 'var(--text-secondary)' }}>{roteiro.descricao}</p>
      <p style={{ color: 'var(--text-secondary)' }}>Orçamento: {roteiro.orcamento}</p>
      <section style={{ marginTop: 20 }}>
        <h3>Timeline</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Dias e atividades estarão aqui (integração com /dias).</p>
      </section>
    </main>
  )
}
