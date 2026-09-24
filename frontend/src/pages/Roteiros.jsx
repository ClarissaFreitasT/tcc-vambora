import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, requireAuth } from '../data/api'

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

export default function Roteiros() {
  const navigate = useNavigate()
  const [roteiros, setRoteiros] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  async function loadRoteiros() {
    if (!requireAuth(navigate)) return
    setLoading(true)
    try {
      setRoteiros(await apiFetch('/roteiros'))
      setStatus(null)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialRoteiros() {
      if (!localStorage.getItem('vambora_token')) {
        navigate('/login')
        return
      }
      setLoading(true)
      try {
        setRoteiros(await apiFetch('/roteiros'))
        setStatus(null)
      } catch (error) {
        setStatus(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadInitialRoteiros()
  }, [navigate])

  async function toggleVisibility(roteiro) {
    try {
      await apiFetch(`/roteiros/${roteiro.id}`, { method: 'PATCH', body: JSON.stringify({ publico: !roteiro.publico }) })
      await loadRoteiros()
    } catch (error) { setStatus(error.message) }
  }

  async function deleteRoteiro(id) {
    if (!window.confirm('Deseja realmente excluir este roteiro?')) return
    try {
      await apiFetch(`/roteiros/${id}`, { method: 'DELETE' })
      await loadRoteiros()
    } catch (error) { setStatus(error.message) }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.1),_transparent_45%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col gap-6 rounded-[36px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:flex-row lg:items-end lg:justify-between lg:p-10">
          <div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Seus roteiros</p><h1 className="mt-4 text-4xl font-black text-slate-900">Todas as suas viagens em um só lugar</h1><p className="mt-3 text-slate-600">Crie, edite e organize cada dia diretamente no banco de dados.</p></div>
          <Link to="/roteiros/novo" className="btn-primary">Criar novo roteiro</Link>
        </div>
        {status ? <div className="mt-6 rounded-3xl bg-red-50 p-4 text-sm text-red-800">{status}</div> : null}
        {loading ? <div className="mt-8 rounded-3xl bg-white p-8 text-slate-500">Carregando roteiros...</div> : null}
        {!loading && roteiros.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-slate-600">Nenhum roteiro criado ainda.</div> : null}
        <div className="mt-8 grid gap-6">
          {roteiros.map((roteiro) => (
            <article key={roteiro.id} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.07)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">{roteiro.publico ? 'Público' : 'Privado'}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{formatMoney(roteiro.orcamento)}</span></div><h2 className="mt-4 text-2xl font-black text-slate-900">{roteiro.titulo}</h2><p className="mt-2 text-slate-600">{roteiro.destino}</p></div><div className="flex flex-wrap gap-3"><button className="btn-primary" onClick={() => navigate(`/roteiros/${roteiro.id}`)}>Abrir e editar</button><button className="btn-secondary" onClick={() => toggleVisibility(roteiro)}>{roteiro.publico ? 'Tornar privado' : 'Tornar público'}</button></div></div>
              <div className="mt-6 flex flex-wrap gap-3"><button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={() => deleteRoteiro(roteiro.id)}>Excluir roteiro</button></div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
