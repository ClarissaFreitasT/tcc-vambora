import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Roteiros() {
  const [roteiros, setRoteiros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/roteiros')
      .then((r) => r.json())
      .then((data) => setRoteiros(data))
      .catch(() => setRoteiros([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="container mx-auto px-4 py-16 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8]">Roteiros</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Roteiros públicos disponíveis</h2>
        </div>
        <Link to="/roteiros/novo" className="btn-primary">
          Novo roteiro
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Buscando dados do backend...</p>
      ) : roteiros.length === 0 ? (
        <p className="text-slate-500">Nenhum roteiro encontrado.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {roteiros.map((roteiro) => (
            <motion.article
              key={roteiro.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.18 }}
              className="card overflow-hidden p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">{roteiro.titulo}</h3>
                <span className="rounded-full bg-[#E0F4FF] px-3 py-1 text-sm font-semibold text-[#00B4D8]">
                  {roteiro.destino || 'Sem destino'}
                </span>
              </div>
              <p className="text-sm text-slate-600">{roteiro.descricao || 'Descrição não cadastrada.'}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-2xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  Orçamento: {roteiro.orcamento || '---'}
                </span>
                <Link to={`/roteiros/${roteiro.id}`} className="btn-secondary">
                  Ver detalhes
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </main>
  )
}
