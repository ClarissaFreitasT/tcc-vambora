import { Link } from 'react-router-dom'
import ImageFallback from './ImageFallback'

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

export default function RoteiroCard({ roteiro, publicOnly = false }) {
  const totalDias = roteiro.dias?.length || 0
  const categorias = roteiro.categorias?.map((item) => item.categoria?.nome).filter(Boolean) || []

  return (
    <article className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(37,99,235,0.13)]">
      <div className="relative flex aspect-[16/8] items-end overflow-hidden bg-[linear-gradient(125deg,#172554_0%,#2563eb_52%,#38bdf8_100%)] p-5">
        <ImageFallback src={roteiro.imagemUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 transition duration-500 group-hover:scale-105" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">{publicOnly || roteiro.publico ? 'Roteiro público' : 'Meu roteiro'}</p>
          <p className="mt-1 text-2xl font-black text-white">{roteiro.destino}</p>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900 transition group-hover:text-[#2563EB]">{roteiro.titulo}</h2>
          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB]">{totalDias} {totalDias === 1 ? 'dia' : 'dias'}</span>
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{roteiro.descricao || 'Confira o planejamento completo desta viagem.'}</p>
        {categorias.length ? <div className="mt-4 flex flex-wrap gap-2">{categorias.map((categoria) => <span key={categoria} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{categoria}</span>)}</div> : null}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold text-slate-700">{formatMoney(roteiro.orcamento)}</span>
          <Link to={`/roteiros/${roteiro.id}`} className="btn-primary px-4 py-2.5">Ver roteiro</Link>
        </div>
      </div>
    </article>
  )
}
