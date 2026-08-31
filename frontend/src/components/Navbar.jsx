import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link to="/" className="text-xl font-black tracking-tight text-slate-900">
          ✈️ VAMBORA
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <Link className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]" to="/roteiros">
            Roteiros
          </Link>
          <Link className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]" to="/comunidade">
            Comunidade
          </Link>
          <Link className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]" to="/perfil">
            Perfil
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/perfil" className="btn-secondary">
            Criar perfil
          </Link>
          <button className="btn-primary" onClick={() => navigate('/roteiros/novo')}>
            + Criar roteiro
          </button>
        </div>
      </div>
    </nav>
  )
}
