import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link to="/" className="text-xl font-black tracking-tight text-slate-900">
          VAMBORA
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm font-semibold text-slate-600 transition hover:text-slate-900" to="/roteiros">
            Roteiros
          </Link>
          <Link className="text-sm font-semibold text-slate-600 transition hover:text-slate-900" to="/comunidade">
            Comunidade
          </Link>
          <Link className="text-sm font-semibold text-slate-600 transition hover:text-slate-900" to="/perfil">
            Perfil
          </Link>
          <button className="btn-primary" onClick={() => navigate('/roteiros/novo')}>
            Criar roteiro
          </button>
        </div>
      </div>
    </nav>
  )
}
