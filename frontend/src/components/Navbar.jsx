import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("vambora_token")),
  );

  useEffect(() => {
    function syncLoginState() {
      setIsLoggedIn(Boolean(localStorage.getItem("vambora_token")));
    }

    syncLoginState();
    window.addEventListener("storage", syncLoginState);

    return () => window.removeEventListener("storage", syncLoginState);
  }, []);

  function handleLogout() {
    localStorage.removeItem("vambora_token");
    localStorage.removeItem("vambora_usuario");
    setIsLoggedIn(false);
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

        {isLoggedIn ? (
          <div className="flex flex-wrap items-center gap-4">
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/roteiros"
            >
              Meus roteiros
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
              Perfil
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
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
              Perfil
            </Link>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {isLoggedIn ? (
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
              <Link to="/perfil" className="btn-primary">
                Criar perfil
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
