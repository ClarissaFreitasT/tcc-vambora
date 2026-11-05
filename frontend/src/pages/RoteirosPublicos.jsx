import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { apiFetch } from "../data/api";
import ImageFallback from "../components/ImageFallback";
import RoteiroSearchPanel from "../components/RoteiroSearchPanel";
import { useAuth } from "../context/useAuth";
import {
  emptyRouteFilters,
  getRecentRouteSuggestions,
  getRouteCategories,
  getRouteDestinations,
} from "../utils/homeRoutes";
import "./RoteirosPublicos.css";

function money(value) {
  if (value === null || value === undefined || value === "")
    return "Orçamento não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function days(route) {
  return route.totalDias ?? route.dias?.length ?? 0;
}

function formatDays(route) {
  const total = days(route);
  if (!total) return "Duração não informada";
  return `${total} ${total === 1 ? "dia" : "dias"}`;
}

function PublicRouteCard({
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

function makeQuery(filters) {
  const params = new URLSearchParams();
  if (filters.destino.trim()) params.set("destino", filters.destino.trim());
  if (filters.termo?.trim()) params.set("termo", filters.termo.trim());
  if (filters.orcamentoMax) params.set("orcamentoMax", filters.orcamentoMax);
  if (filters.dias) params.set("dias", filters.dias);
  if (filters.avaliacaoMin) params.set("avaliacaoMin", filters.avaliacaoMin);
  if (filters.categoriaIds.length)
    params.set("categorias", filters.categoriaIds.join(","));
  return params;
}

function filtersFromSearchParams(searchParams) {
  return {
    ...emptyRouteFilters,
    destino: searchParams.get("destino") || searchParams.get("busca") || "",
    orcamentoMin: "",
    orcamentoMax: searchParams.get("orcamentoMax") || "",
    dias: searchParams.get("dias") || "",
    avaliacaoMin: searchParams.get("avaliacaoMin") || "",
    categoriaIds: (searchParams.get("categorias") || "")
      .split(",")
      .filter(Boolean),
  };
}

function chipsFor(filters, categories) {
  const chips = [];
  if (filters.destino)
    chips.push({ id: "destino", text: `Destino: ${filters.destino}` });
  if (filters.orcamentoMax)
    chips.push({
      id: "orcamentoMax",
      text: `Máx. ${money(filters.orcamentoMax)}`,
    });
  if (filters.dias)
    chips.push({
      id: "dias",
      text: `${filters.dias} ${filters.dias === "1" ? "dia" : "dias"}`,
    });
  if (filters.avaliacaoMin)
    chips.push({
      id: "avaliacaoMin",
      text: `${filters.avaliacaoMin}+ estrelas`,
    });
  filters.categoriaIds.forEach((id) => {
    const category = categories.find((item) => item.id === id);
    if (category) chips.push({ id: `categoria:${id}`, text: category.nome });
  });
  return chips;
}

export default function RoteirosPublicos() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const searchParamsKey = searchParams.toString();
  const initialFilters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );
  const hasInitialSearch = Boolean(searchParamsKey);
  const [allRoutes, setAllRoutes] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
  }));
  const [appliedFilters, setAppliedFilters] = useState(
    hasInitialSearch ? { ...initialFilters } : null,
  );
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState(null);
  const [savedRouteState, setSavedRouteState] = useState({
    userId: null,
    ids: [],
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return undefined;

    let active = true;
    apiFetch("/roteiros/salvos")
      .then((entries) => {
        if (!active) return;
        setSavedRouteState({
          userId: user.id,
          ids: entries
            .map((entry) => entry.roteiroId || entry.roteiro?.id)
            .filter(Boolean),
        });
      })
      .catch(() => {
        if (active) setSavedRouteState({ userId: user.id, ids: [] });
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  const savedRouteIds =
    isAuthenticated && savedRouteState.userId === user?.id
      ? savedRouteState.ids
      : [];
  const savedRoutesLoading =
    isAuthenticated && savedRouteState.userId !== user?.id;

  function updateSavedRoute(routeId, saved) {
    setSavedRouteState((current) => {
      if (current.userId !== user?.id) return current;
      if (saved)
        return current.ids.includes(routeId)
          ? current
          : { ...current, ids: [...current.ids, routeId] };
      return {
        ...current,
        ids: current.ids.filter((id) => id !== routeId),
      };
    });
  }

  const destinations = useMemo(
    () => getRouteDestinations(allRoutes),
    [allRoutes],
  );
  const categories = useMemo(() => getRouteCategories(allRoutes), [allRoutes]);
  const recentAlternatives = useMemo(
    () =>
      appliedFilters && routes.length === 0
        ? getRecentRouteSuggestions(allRoutes, [], 4)
        : [],
    [allRoutes, appliedFilters, routes.length],
  );
  const chips = appliedFilters ? chipsFor(appliedFilters, categories) : [];

  const searchRoutes = useCallback(async (nextFilters) => {
    setLoadingResults(true);
    setError(null);
    setAppliedFilters({
      ...nextFilters,
      categoriaIds: [...nextFilters.categoriaIds],
    });
    try {
      const query = makeQuery(nextFilters);
      const result = await apiFetch(
        `/roteiros/publicos${query.size ? `?${query.toString()}` : ""}`,
      );
      setRoutes(result);
    } catch (requestError) {
      setError(requestError.message);
      setRoutes([]);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadInitialRoutes() {
      try {
        const query = makeQuery(initialFilters);
        const [all, matching] = await Promise.all([
          apiFetch("/roteiros/publicos"),
          hasInitialSearch
            ? apiFetch(`/roteiros/publicos?${query.toString()}`)
            : Promise.resolve(null),
        ]);
        if (!active) return;
        setAllRoutes(all);
        setRoutes(matching || all);
        if (hasInitialSearch) {
          setAppliedFilters({ ...initialFilters });
          setFilters({ ...initialFilters });
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) {
          setLoadingOptions(false);
          setLoadingResults(false);
        }
      }
    }
    loadInitialRoutes();
    return () => {
      active = false;
    };
  }, [hasInitialSearch, initialFilters, searchParamsKey]);

  function removeFilter(id) {
    const next = { ...appliedFilters };
    if (id.startsWith("categoria:")) {
      const categoryId = id.slice("categoria:".length);
      next.categoriaIds = next.categoriaIds.filter(
        (categoryIdInList) => categoryIdInList !== categoryId,
      );
    } else next[id] = "";
    setFilters(next);
    searchRoutes(next);
  }

  function clearFilters() {
    const cleared = { ...emptyRouteFilters, categoriaIds: [] };
    setFilters(cleared);
    searchRoutes(cleared);
  }

  return (
    <main className="public-routes-page">
      <header className="public-routes-hero">
        <div className="public-routes-hero-content">
          <h1>Encontre roteiros para sua próxima viagem</h1>
          <p>
            Use os filtros para encontrar opções por destino, duração,
            orçamento, avaliação.
          </p>
        </div>
        <svg
          className="public-routes-wave"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 44Q180 0 360 44T720 44T1080 44T1440 44V80H0Z"
            fill="#9CCBF5"
            opacity=".45"
          />
          <path
            d="M0 60Q180 26 360 60T720 60T1080 60T1440 60V80H0Z"
            fill="var(--public-routes-bg)"
          />
        </svg>
      </header>

      <div className="public-routes-search">
        <RoteiroSearchPanel
          destinations={destinations}
          categories={categories}
          value={filters}
          onChange={setFilters}
          onSubmit={searchRoutes}
          busy={loadingResults || loadingOptions}
          submitLabel="Vambora!"
          homeLayout
          filtersInitiallyOpen
        />
      </div>

      <section
        className="public-routes-results"
        aria-live="polite"
        aria-labelledby="public-routes-title"
      >
        <h2 id="public-routes-title" className="sr-only">
          {appliedFilters
            ? `${routes.length} roteiros correspondentes`
            : "Todos os roteiros públicos"}
        </h2>
        {appliedFilters && chips.length ? (
          <div className="public-routes-applied-filters">
            <div className="public-routes-filter-chips">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => removeFilter(chip.id)}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                >
                  {chip.text} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="public-routes-clear-filters"
            >
              Limpar todos
            </button>
          </div>
        ) : null}
        {loadingOptions || loadingResults ? (
          <div
            className="public-route-grid"
            role="status"
            aria-label="Carregando roteiros"
          >
            <div className="public-route-skeleton" />
            <div className="public-route-skeleton" />
            <div className="public-route-skeleton" />
          </div>
        ) : null}
        {error ? (
          <div className="public-routes-error">
            <p role="alert">Não foi possível carregar os roteiros: {error}</p>
            <button
              type="button"
              onClick={() => searchRoutes(appliedFilters || emptyRouteFilters)}
            >
              Tentar novamente
            </button>
          </div>
        ) : null}
        {!loadingOptions && !loadingResults && !error && routes.length ? (
          <div className="public-route-grid">
            {routes.map((route) => (
              <PublicRouteCard
                key={route.id}
                route={route}
                isAuthenticated={isAuthenticated}
                saved={savedRouteIds.includes(route.id)}
                savedLoading={savedRoutesLoading}
                onSavedChange={updateSavedRoute}
              />
            ))}
          </div>
        ) : null}
        {!loadingOptions && !loadingResults && !error && !allRoutes.length ? (
          <div className="public-routes-empty">
            <p className="font-bold text-slate-800">
              Ainda não há roteiros públicos.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Quando viajantes compartilharem seus planos, eles aparecerão aqui.
            </p>
          </div>
        ) : null}
        {!loadingOptions &&
        !loadingResults &&
        !error &&
        routes.length === 0 &&
        allRoutes.length > 0 ? (
          <div className="public-routes-no-results">
            <div>
              <p className="font-bold text-slate-900">
                Não encontramos roteiros que atendam a todos os filtros.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Estas sugestões recentes podem não atender a todos os critérios
                selecionados.
              </p>
            </div>
            {recentAlternatives.length ? (
              <div className="public-route-grid public-route-grid--suggestions">
                {recentAlternatives.map((route) => (
                  <PublicRouteCard
                    key={route.id}
                    route={route}
                    suggestion
                    isAuthenticated={isAuthenticated}
                    saved={savedRouteIds.includes(route.id)}
                    savedLoading={savedRoutesLoading}
                    onSavedChange={updateSavedRoute}
                  />
                ))}
              </div>
            ) : (
              <p className="public-routes-no-suggestions">
                Não há outras sugestões disponíveis.
              </p>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
