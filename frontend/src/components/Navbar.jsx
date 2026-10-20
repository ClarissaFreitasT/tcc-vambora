import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const isLoggedIn = isAuthenticated;

  function handleLogout() {
    setProfileMenuOpen(false);
    logout();
    navigate("/login");
  }

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        profileButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

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
            {location.pathname !== "/" ? (
              <Link
                className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
                to="/explorar"
              >
                Explorar globo
              </Link>
            ) : null}
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/roteiros"
              hidden={location.pathname === "/"}
            >
              Meus roteiros
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/roteiros/salvos"
              hidden={location.pathname === "/"}
            >
              Salvos
            </Link>
            <Link
              className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
              to="/comunidade"
            >
              Comunidade
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            {location.pathname !== "/" ? (
              <Link
                className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
                to="/explorar"
              >
                Explorar globo
              </Link>
            ) : null}
            {location.pathname !== "/" ? (
              <Link
                className="text-sm font-semibold text-slate-600 transition hover:text-[#2563EB]"
                to="/roteiros/publicos"
              >
                Explorar roteiros
              </Link>
            ) : null}
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
              {location.pathname !== "/" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/roteiros/novo")}
                >
                  Criar roteiro
                </button>
              ) : null}
              <div className="relative" ref={profileMenuRef}>
                <button
                  ref={profileButtonRef}
                  type="button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="grid h-10 w-10 place-items-center rounded-full ring-2 ring-transparent transition hover:ring-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5965F2]"
                  aria-label="Abrir menu do perfil"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-controls="navbar-profile-menu"
                >
                  <UserAvatar
                    user={user}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                </button>
                {profileMenuOpen ? (
                  <div
                    id="navbar-profile-menu"
                    role="menu"
                    aria-label="Menu do perfil"
                    className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
                  >
                    <Link
                      role="menuitem"
                      to="/perfil"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#5965F2] focus:bg-slate-50 focus:outline-none"
                    >
                      Ver perfil
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                    >
                      Sair
                    </button>
                  </div>
                ) : null}
              </div>
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
