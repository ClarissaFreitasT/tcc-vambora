import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Comunidade() {
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/usuarios')
      .then((r) => r.json())
      .then(setUsuarios)
      .catch(() => setUsuarios([]))
  }, [])

  return (
    <main className="container" style={{ paddingBlock: 40 }}>
      <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>Comunidade</motion.h2>
      <p style={{ color: 'var(--text-secondary)' }}>Viajantes da comunidade</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 20 }}>
        {usuarios.map((u) => (
          <motion.article key={u.id} className="card" whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }}>
            <div style={{ width: '100%', height: 160, borderRadius: 12, overflow: 'hidden' }}>
              <img src={u.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome || 'Usuario')}`} alt={u.nome} />
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>{u.nome}</strong>
              <p style={{ color: 'var(--text-secondary)' }}>{u.bio}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{u.personalidade}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </main>
  )
}
