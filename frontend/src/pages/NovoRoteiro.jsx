import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NovoRoteiro() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [destino, setDestino] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await fetch('http://localhost:3000/roteiros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, destino, publico: true })
    })
    navigate('/roteiros')
  }

  return (
    <main className="container" style={{ paddingBlock: 40 }}>
      <h2>Criar roteiro</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <label>
          Destino
          <input value={destino} onChange={(e) => setDestino(e.target.value)} />
        </label>
        <div>
          <button className="btn btn-primary" type="submit">Criar roteiro</button>
        </div>
      </form>
    </main>
  )
}
