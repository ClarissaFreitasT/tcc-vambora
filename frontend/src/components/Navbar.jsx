import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link to="/" className="text-xl font-black tracking-tight text-[#0F172A]">
          ✈️ VAMBORA
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <Link className="text-sm font-semibold text-[#334155] transition hover:text-[#0F4C81]" to="/roteiros">
            Roteiros
          </Link>
          <Link className="text-sm font-semibold text-[#334155] transition hover:text-[#0F4C81]" to="/comunidade">
            Comunidade
          </Link>
          <Link className="text-sm font-semibold text-[#334155] transition hover:text-[#0F4C81]" to="/perfil">
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
