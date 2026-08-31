import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getStoredRoteiros, removeStoredRoteiro, updateStoredRoteiro } from '../data/storage'

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function Roteiros() {
  const navigate = useNavigate()
  const [roteiros, setRoteiros] = useState([])
  const [status, setStatus] = useState('Carregando seus roteiros...')

  useEffect(() => {
    const stored = getStoredRoteiros()
    if (stored.length > 0) {
      setRoteiros(stored)
      setStatus(null)
      return
    }

    setRoteiros([])
    setStatus('Nenhum roteiro criado ainda. Clique em "Criar novo roteiro" para começar.')
  }, [])

  function refreshRoteiros() {
    const next = getStoredRoteiros()
    setRoteiros(next)
    if (next.length === 0) {
      setStatus('Nenhum roteiro criado ainda. Clique em "Criar novo roteiro" para começar.')
    } else {
      setStatus('')
    }
  }

  function handleToggleVisibility(id) {
    const updated = updateStoredRoteiro(id, (roteiro) => ({
      ...roteiro,
      publico: !roteiro.publico
    }))

    if (updated) {
      refreshRoteiros()
      setStatus(`Roteiro definido como ${updated.publico ? 'Público' : 'Privado'}.`)
    }
  }

  function handleDelete(id) {
    if (!window.confirm('Deseja realmente excluir este roteiro?')) return
    removeStoredRoteiro(id)
    refreshRoteiros()
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.1),_transparent_45%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto rounded-[36px] border border-slate-200 bg-white/85 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Seus roteiros</p>
            <h1 className="mt-4 text-4xl font-black text-slate-900">Acompanhe cada viagem como um plano premium</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Gerencie destinos, durações, estilos e visibilidade em uma experiência visual mais fluida e elegante.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/roteiros/novo" className="btn-primary">
              Criar novo roteiro
            </Link>
          </div>
        </div>
      </div>

      {status ? (
        <div className="container mx-auto mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-center text-slate-700">
          {status}
        </div>
      ) : null}

      {roteiros.length === 0 ? (
        <div className="container mx-auto mt-8 rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-14 text-center text-slate-600 shadow-sm">
          <p className="text-xl font-semibold text-slate-900">Nenhum roteiro encontrado</p>
          <p className="mt-3 text-sm text-slate-600">Inicie sua primeira viagem clicando em "Criar novo roteiro".</p>
        </div>
      ) : (
        <div className="container mx-auto mt-8 space-y-6">
          {roteiros.map((roteiro) => (
            <motion.article
              key={roteiro.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#E0F4FF] px-3 py-1 text-sm font-semibold text-[#2563EB]">
                      {roteiro.publico ? 'Público' : 'Privado'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {roteiro.orcamento}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {roteiro.duracao} dias
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">{roteiro.titulo || `Roteiro em ${roteiro.destino}`}</h2>
                  <p className="text-sm text-slate-600">{roteiro.destino} · Estilos: {roteiro.estiloViajante}</p>
                  <p className="text-sm text-slate-500">Criado em {formatDate(roteiro.createdAt || roteiro.createdAt)}</p>
                </div>
                <div className="grid gap-3 sm:auto-cols-auto sm:grid-flow-col">
                  <button type="button" className="btn-secondary" onClick={() => navigate(`/roteiros/${roteiro.id}`)}>
                    Abrir roteiro
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => navigate(`/roteiros/${roteiro.id}`)}>
                    Editar
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700 shadow-sm">
                  <p className="font-semibold text-slate-900">Resumo do roteiro</p>
                  <p className="mt-4 leading-7 text-slate-600">
                    Viagem para {roteiro.destino} com duração de {roteiro.duracao} dias, estilo {roteiro.estiloViajante} e orçamento {roteiro.orcamento}.
                  </p>
                </div>
                <div className="space-y-3 rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <button type="button" className="btn-secondary w-full" onClick={() => handleToggleVisibility(roteiro.id)}>
                    {roteiro.publico ? 'Tornar privado' : 'Tornar público'}
                  </button>
                  <button type="button" className="btn-secondary w-full border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDelete(roteiro.id)}>
                    Excluir roteiro
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </main>
  )
}
