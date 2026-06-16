import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link to="/" className="text-xl font-black tracking-tight text-[#0F172A]">
          ✈️ VAMBORA
        </Link>

        <div className="flex flex-wrap items-center gap-6">
          <Link className="text-sm font-semibold text-[#64748B] transition hover:text-[#00B4D8]" to="/roteiros">
            Roteiros
          </Link>
          <Link className="text-sm font-semibold text-[#64748B] transition hover:text-[#00B4D8]" to="/comunidade">
            Comunidade
          </Link>
          <Link className="text-sm font-semibold text-[#64748B] transition hover:text-[#00B4D8]" to="/perfil">
            Perfil
          </Link>
          <button className="btn-primary" onClick={() => navigate('/roteiros/novo')}>
            + Criar roteiro
          </button>
        </div>
      </div>
    </nav>
  )
}
