import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../context/useAuth";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const pathname = location.pathname;
  const isHome = pathname === "/";
  const isCreate = pathname === "/roteiros/novo";
  const isProfile = pathname.startsWith("/perfil");
  const isExplore =
    pathname === "/roteiros/publicos" ||
    (pathname.startsWith("/roteiros/") &&
      !["/roteiros/novo", "/roteiros/salvos"].includes(pathname));

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

  const navLinkClass = (active) =>
    `vambora-nav-link${active ? " is-active" : ""}`;

  return (
    <nav
      className={`vambora-navbar${isHome ? " vambora-navbar--home" : ""}`}
      aria-label="Navegação principal"
    >
      <div className="vambora-navbar-inner">
        <Link
          to="/"
          className="vambora-brand vambora-navbar-brand"
          aria-label="Vambora - página inicial"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo-vambora.png`}
            alt=""
            className="vambora-logo-image"
          />
        </Link>

        <div className="vambora-navbar-links">
          <Link
            to="/"
            className={navLinkClass(isHome)}
            aria-current={isHome ? "page" : undefined}
          >
            Início
          </Link>
          <Link
            to="/roteiros/publicos"
            className={navLinkClass(isExplore)}
            aria-current={isExplore ? "page" : undefined}
          >
            Explorar
          </Link>
          <Link
            to="/comunidade"
            className={navLinkClass(pathname.startsWith("/comunidade"))}
            aria-current={
              pathname.startsWith("/comunidade") ? "page" : undefined
            }
          >
            Comunidade
          </Link>
        </div>

        <div className="vambora-navbar-actions">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className={`vambora-create-link${isCreate ? " is-active" : ""}`}
                onClick={() => navigate("/roteiros/novo")}
                aria-current={isCreate ? "page" : undefined}
              >
                Criar Roteiro
              </button>
              <div className="vambora-account-menu" ref={profileMenuRef}>
                <button
                  ref={profileButtonRef}
                  type="button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className={`vambora-account-button${isProfile ? " is-active" : ""}`}
                  aria-label="Abrir menu da conta"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-controls="navbar-profile-menu"
                >
                  <UserAvatar
                    user={user}
                    alt=""
                    className="vambora-account-avatar"
                  />
                </button>
                {profileMenuOpen ? (
                  <div
                    id="navbar-profile-menu"
                    role="menu"
                    aria-label="Menu da conta"
                    className="vambora-account-dropdown"
                  >
                    {loading ? (
                      <span className="vambora-account-status">
                        Verificando sessão…
                      </span>
                    ) : (
                      <>
                        <Link
                          role="menuitem"
                          to="/perfil"
                          onClick={() => setProfileMenuOpen(false)}
                          className="vambora-account-menu-item"
                        >
                          Ver perfil
                        </Link>
                        <button
                          role="menuitem"
                          type="button"
                          onClick={handleLogout}
                          className="vambora-account-menu-item is-danger"
                        >
                          Sair
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="vambora-auth-link">
                Entrar
              </Link>
              <Link to="/cadastro" className="vambora-auth-link is-primary">
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
