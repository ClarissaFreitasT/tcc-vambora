import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Roteiros() {
  const [roteiros, setRoteiros] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/roteiros')
      .then((r) => r.json())
      .then(setRoteiros)
      .catch(() => setRoteiros([]))
  }, [])

  return (
    <main className="container" style={{ paddingBlock: 40 }}>
      <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>Roteiros públicos</motion.h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
        {roteiros.map((r) => (
          <motion.article whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }} key={r.id} className="card">
            <h3>{r.titulo}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{r.destino}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{r.descricao}</p>
            <div style={{ marginTop: 12 }}>
              <Link to={`/roteiros/${r.id}`} className="btn btn-secondary">Ver detalhes</Link>
            </div>
          </motion.article>
        ))}
      </div>
    </main>
  )
}
