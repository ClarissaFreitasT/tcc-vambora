import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../data/api";
import ImageFallback from "./ImageFallback";

function money(value) {
  if (value === null || value === undefined || value === "")
    return "Orçamento não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDays(route) {
  const total = route.totalDias ?? route.dias?.length ?? 0;
  if (!total) return "Duração não informada";
  return `${total} ${total === 1 ? "dia" : "dias"}`;
}

export default function RoteiroPublicoCard({
  route,
  suggestion = false,
  isAuthenticated,
  saved,
  savedLoading,
  onSavedChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const totalReviews = Number(route.totalAvaliacoes || 0);
  const [totalLikes, setTotalLikes] = useState(
    Number(route.totalCurtidas || 0),
  );
  const [liked, setLiked] = useState(false);
  const [likesLoading, setLikesLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let active = true;
    apiFetch(`/roteiros/${route.id}/curtidas`)
      .then((result) => {
        if (!active) return;
        setTotalLikes(
          Number(result?.totalCurtidas ?? route.totalCurtidas ?? 0),
        );
        setLiked(Boolean(result?.curtiu));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLikesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [route.id, route.totalCurtidas]);

  function requireLogin() {
    navigate("/login", {
      state: { from: `${location.pathname}${location.search}` },
    });
  }

  async function toggleLike(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    if (likeBusy || likesLoading) return;
    setLikeBusy(true);
    setActionError(null);
    try {
      const result = await apiFetch(`/roteiros/${route.id}/curtir`, {
        method: liked ? "DELETE" : "POST",
      });
      setLiked(!liked);
      setTotalLikes(Number(result?.totalCurtidas ?? totalLikes));
    } catch (error) {
      if (!liked && error.status === 409) {
        setLiked(true);
        setTotalLikes((current) => current + 1);
      } else setActionError(error.message);
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleSaved(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    if (saveBusy || savedLoading) return;
    setSaveBusy(true);
    setActionError(null);
    try {
      await apiFetch(`/roteiros/${route.id}/salvar`, {
        method: saved ? "DELETE" : "POST",
      });
      onSavedChange(route.id, !saved);
    } catch (error) {
      if (!saved && error.status === 409) onSavedChange(route.id, true);
      else setActionError(error.message);
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <article className="home-route-card public-route-card group relative isolate">
      <Link to={`/roteiros/${route.id}`} className="public-route-card-link">
        <ImageFallback
          src={route.imagemUrl}
          alt={`Paisagem do roteiro para ${route.destino}`}
          className="public-route-image"
        />
        <div className="public-route-image-overlay" />
        {suggestion ? (
          <span className="public-route-card-badge">Sugestão recente</span>
        ) : null}
        <div className="home-route-card-content absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <p className="home-route-destination text-xs font-bold uppercase tracking-[.2em] text-cyan-200">
            {route.destino}
          </p>
          <h2 className="home-display mt-2 line-clamp-2 text-2xl font-black leading-tight text-white">
            {route.titulo}
          </h2>
          <p className="mt-2 text-sm text-white/75">
            Por {route.usuario?.nome || "Viajante Vambora"}
          </p>
          <div className="public-route-meta mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/20 pt-3 text-sm font-medium text-white/90">
            {totalReviews ? (
              <span>
                ★ {Number(route.mediaAvaliacao).toFixed(1)} ({totalReviews})
              </span>
            ) : (
              <span>Ainda sem avaliações</span>
            )}
            <span>{money(route.orcamento)}</span>
            <span>{formatDays(route)}</span>
          </div>
        </div>
      </Link>
      <div className="public-route-social-actions">
        <button
          type="button"
          className={`public-route-social-button public-route-like-button${liked ? " is-active" : ""}`}
          onClick={toggleLike}
          disabled={likesLoading || likeBusy}
          aria-label={liked ? "Remover curtida do roteiro" : "Curtir roteiro"}
          aria-pressed={liked}
          title={liked ? "Remover curtida" : "Curtir roteiro"}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
          </svg>
          <span>{totalLikes}</span>
        </button>
        <button
          type="button"
          className={`public-route-social-button public-route-save-button${saved ? " is-active" : ""}`}
          onClick={toggleSaved}
          disabled={savedLoading || saveBusy}
          aria-label={saved ? "Remover roteiro dos salvos" : "Salvar roteiro"}
          aria-pressed={saved}
          title={saved ? "Remover dos salvos" : "Salvar roteiro"}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" />
          </svg>
        </button>
      </div>
      {actionError ? (
        <span className="public-route-action-error" role="status">
          {actionError}
        </span>
      ) : null}
    </article>
  );
}
