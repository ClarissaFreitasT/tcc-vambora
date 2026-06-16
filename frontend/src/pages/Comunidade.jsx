import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Comunidade() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/usuarios')
      .then((r) => r.json())
      .then((data) => setUsuarios(data))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="container mx-auto px-4 py-16 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8]">Comunidade</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Viajantes conectados</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Dados reais de usuários carregados do backend para demonstrar a integração entre frontend e backend.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Carregando perfil da comunidade...</p>
      ) : usuarios.length === 0 ? (
        <p className="text-slate-500">Nenhum usuário encontrado.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {usuarios.map((u) => (
            <motion.article
              key={u.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.18 }}
              className="card overflow-hidden"
            >
              <div className="h-52 overflow-hidden bg-slate-100">
                <img
                  className="h-full w-full object-cover"
                  src={u.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome || 'Usuário')}`}
                  alt={u.nome}
                />
              </div>
              <div className="space-y-3 p-6">
                <h3 className="text-xl font-semibold text-slate-900">{u.nome}</h3>
                <p className="text-sm text-slate-600">{u.bio || 'Bio não cadastrada.'}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">Personalidade: {u.personalidade || 'N/A'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Orçamento: {u.orcamentoPerfil || 'N/A'}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </main>
  )
}
