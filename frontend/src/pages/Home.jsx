import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiFetch } from '../data/api'
import RoteiroCard from '../components/RoteiroCard'

const benefits = [
  ['01', 'Descubra', 'Explore roteiros publicados por pessoas que já viajaram.'],
  ['02', 'Consulte', 'Veja cada dia, horário, local e custo em uma única visão.'],
  ['03', 'Planeje', 'Crie seu próprio roteiro quando estiver pronto para partir.']
]

export default function Home() {
  const [roteiros, setRoteiros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('')

  useEffect(() => {
    apiFetch('/roteiros/publicos')
      .then(setRoteiros)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => [...new Set(roteiros.flatMap((roteiro) => roteiro.categorias?.map((item) => item.categoria?.nome) || []))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR')), [roteiros])
  const filteredRoteiros = category ? roteiros.filter((roteiro) => roteiro.categorias?.some((item) => item.categoria?.nome === category)) : roteiros

  return (
    <main className="site-shell overflow-hidden">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(56,189,248,0.38),transparent_28%),linear-gradient(120deg,#020617_0%,#172554_55%,#075985_100%)]" />
        <div className="relative mx-auto grid min-h-[72vh] max-w-[1280px] items-center gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">Vambora!</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">A próxima viagem começa com um bom roteiro.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">Encontre ideias reais, consulte cada detalhe e transforme inspiração em dias bem aproveitados.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/roteiros/publicos" className="btn-primary bg-cyan-400 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.22)] hover:bg-cyan-300">Explorar roteiros</Link>
              <Link to="/roteiros/novo" className="btn-secondary border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white">Criar meu roteiro</Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative rounded-[32px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">No seu ritmo</p>
              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl font-black">{roteiros.length}</p><p className="mt-1 text-sm text-slate-300">roteiros públicos</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-3xl font-black">{categories.length}</p><p className="mt-1 text-sm text-slate-300">categorias</p></div>
              </div>
              <p className="mt-10 text-2xl font-bold leading-tight">Toda viagem tem uma história. Comece pelo caminho.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container py-20" id="explorar">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="eyebrow">Da comunidade</p><h2 className="mt-3 text-4xl font-black text-slate-900">Roteiros para explorar</h2><p className="mt-3 max-w-2xl text-slate-600">Planos compartilhados, organizados para você visualizar a viagem antes de fazer as malas.</p></div>
          <Link to="/roteiros/publicos" className="btn-secondary w-fit">Ver todos</Link>
        </div>
        {categories.length ? <div className="mt-8 flex flex-wrap gap-2" aria-label="Filtrar por categoria"><button type="button" onClick={() => setCategory('')} className={`rounded-full px-4 py-2 text-sm font-semibold ${!category ? 'bg-[#2563EB] text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Todos</button>{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === item ? 'bg-[#2563EB] text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{item}</button>)}</div> : null}
        {loading ? <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">Carregando roteiros públicos...</div> : null}
        {error ? <div role="alert" className="mt-8 rounded-3xl bg-red-50 p-5 text-sm text-red-800">{error}</div> : null}
        {!loading && !error && !filteredRoteiros.length ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><h3 className="text-xl font-bold text-slate-900">Ainda não há roteiros nesta categoria</h3><p className="mt-2 text-slate-600">Volte depois ou comece a planejar a sua própria viagem.</p></div> : null}
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{filteredRoteiros.slice(0, 3).map((roteiro) => <RoteiroCard key={roteiro.id} roteiro={roteiro} publicOnly />)}</div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="container grid gap-8 py-16 md:grid-cols-3">{benefits.map(([number, title, text]) => <div key={number} className="border-l-2 border-cyan-400 pl-5"><p className="text-sm font-black text-cyan-600">{number}</p><h2 className="mt-3 text-xl font-black text-slate-900">{title}</h2><p className="mt-2 leading-7 text-slate-600">{text}</p></div>)}</div>
      </section>

      <section className="container py-20">
        <div className="rounded-[32px] bg-[#172554] px-7 py-10 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-10"><div><p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">Pronto para sair?</p><h2 className="mt-3 text-3xl font-black">Seu próximo destino merece um plano.</h2></div><Link to="/roteiros/novo" className="btn-primary mt-7 w-fit bg-cyan-400 text-slate-950 hover:bg-cyan-300 lg:mt-0">Montar roteiro</Link></div>
      </section>
    </main>
  )
}
