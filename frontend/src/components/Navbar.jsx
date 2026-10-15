import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useAuth();
  const isLoggedIn = isAuthenticated;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link
          to="/"
          className="text-xl font-black tracking-tight text-slate-900"
        >
          ✈️ VAMBORA
        </Link>

        {loading ? (
          <div
            className="h-8 w-40 animate-pulse rounded-full bg-slate-100"
            aria-label="Verificando sessão"
          />
        ) : isLoggedIn ? (
          <div className="flex flex-wrap items-center gap-4">
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/roteiros"
            >
              Meus roteiros
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/roteiros/salvos"
            >
              Salvos
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/comunidade"
            >
              Comunidade
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/perfil"
            >
              Meu perfil
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/roteiros/publicos"
            >
              Explorar roteiros
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/comunidade"
            >
              Comunidade
            </Link>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {loading ? (
            <span className="text-xs text-slate-500">Verificando sessão…</span>
          ) : isLoggedIn ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/roteiros/novo")}
              >
                Criar roteiro
              </button>
              <button
                type="button"
                className="btn-secondary border-red-200 text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn-primary">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
