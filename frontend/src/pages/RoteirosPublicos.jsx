import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../data/api";
import ImageFallback from "../components/ImageFallback";
import RoteiroSearchPanel from "../components/RoteiroSearchPanel";
import {
  emptyRouteFilters,
  getRecentRouteSuggestions,
  getRouteCategories,
  getRouteDestinations,
} from "../utils/homeRoutes";

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

function PublicRouteCard({ route, suggestion = false }) {
  const totalReviews = Number(route.totalAvaliacoes || 0);
  return (
    <Link
      to={`/roteiros/${route.id}`}
      className="group block overflow-hidden rounded-[24px] border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-56">
        <ImageFallback
          src={route.imagemUrl}
          alt={`Fotografia do roteiro para ${route.destino}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur">
          {suggestion ? "Sugestão recente" : "Roteiro público"}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-blue-700">
          {route.destino}
        </p>
        <h2 className="mt-2 line-clamp-2 text-xl font-black leading-snug text-slate-950">
          {route.titulo}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Por {route.usuario?.nome || "Viajante Vambora"}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {totalReviews ? (
            <span className="font-semibold text-amber-600">
              ★ {Number(route.mediaAvaliacao).toFixed(1)}{" "}
              <span className="font-normal text-slate-500">
                ({totalReviews} avaliações)
              </span>
            </span>
          ) : (
            <span>Ainda sem avaliações</span>
          )}
          <span>{money(route.orcamento)}</span>
          <span>{formatDays(route)}</span>
          <span>♥ {route.totalCurtidas || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function makeQuery(filters) {
  const params = new URLSearchParams();
  if (filters.destino.trim()) params.set("destino", filters.destino.trim());
  if (filters.termo?.trim()) params.set("termo", filters.termo.trim());
  if (filters.orcamentoMin) params.set("orcamentoMin", filters.orcamentoMin);
  if (filters.orcamentoMax) params.set("orcamentoMax", filters.orcamentoMax);
  if (filters.dias) params.set("dias", filters.dias);
  if (filters.avaliacaoMin) params.set("avaliacaoMin", filters.avaliacaoMin);
  if (filters.categoriaIds.length)
    params.set("categorias", filters.categoriaIds.join(","));
  return params;
}

function chipsFor(filters, categories) {
  const chips = [];
  if (filters.destino)
    chips.push({ id: "destino", text: `Destino: ${filters.destino}` });
  if (filters.orcamentoMin)
    chips.push({
      id: "orcamentoMin",
      text: `Mín. ${money(filters.orcamentoMin)}`,
    });
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
  const initialDestination = searchParams.get("busca") || "";
  const [allRoutes, setAllRoutes] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filters, setFilters] = useState(() => ({
    ...emptyRouteFilters,
    destino: initialDestination,
  }));
  const [appliedFilters, setAppliedFilters] = useState(
    initialDestination
      ? { ...emptyRouteFilters, destino: initialDestination }
      : null,
  );
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState(null);

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
        const params = new URLSearchParams();
        if (initialDestination) params.set("destino", initialDestination);
        const [all, matching] = await Promise.all([
          apiFetch("/roteiros/publicos"),
          initialDestination
            ? apiFetch(`/roteiros/publicos?${params.toString()}`)
            : Promise.resolve(null),
        ]);
        if (!active) return;
        setAllRoutes(all);
        setRoutes(matching || all);
        if (initialDestination) {
          setAppliedFilters({
            ...emptyRouteFilters,
            destino: initialDestination,
          });
          setFilters({ ...emptyRouteFilters, destino: initialDestination });
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
  }, [initialDestination]);

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_45%)] px-4 py-10 sm:py-14 lg:px-8">
      <div className="container mx-auto max-w-[1280px]">
        <header className="rounded-[32px] bg-slate-950 p-6 text-white shadow-xl sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">
            Vambora · roteiros públicos
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Encontre um roteiro para começar a planejar
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Combine destino, duração, orçamento, avaliação e tipos de viagem.
            Seus filtros só são aplicados quando você busca.
          </p>
          <div className="mt-6 text-slate-900">
            <RoteiroSearchPanel
              destinations={destinations}
              categories={categories}
              value={filters}
              onChange={setFilters}
              onSubmit={searchRoutes}
              busy={loadingResults || loadingOptions}
              submitLabel="Buscar roteiros"
            />
          </div>
        </header>

        <section
          className="mt-9"
          aria-live="polite"
          aria-labelledby="public-routes-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Planeje no seu ritmo</p>
              <h2
                id="public-routes-title"
                className="mt-2 text-2xl font-black text-slate-950"
              >
                {appliedFilters
                  ? `${routes.length} roteiros correspondentes`
                  : "Todos os roteiros públicos"}
              </h2>
            </div>
            {appliedFilters && chips.length ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-bold text-blue-700 hover:underline"
              >
                Limpar todos
              </button>
            ) : null}
          </div>
          {appliedFilters && chips.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
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
          ) : null}
          {loadingOptions || loadingResults ? (
            <div
              className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              role="status"
              aria-label="Carregando roteiros"
            >
              <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          ) : null}
          {error ? (
            <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm text-red-800">
              <p role="alert">Não foi possível carregar os roteiros: {error}</p>
              <button
                type="button"
                onClick={() =>
                  searchRoutes(appliedFilters || emptyRouteFilters)
                }
                className="mt-2 font-bold underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!loadingOptions && !loadingResults && !error && routes.length ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((route) => (
                <PublicRouteCard key={route.id} route={route} />
              ))}
            </div>
          ) : null}
          {!loadingOptions && !loadingResults && !error && !allRoutes.length ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-bold text-slate-800">
                Ainda não há roteiros públicos.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Quando viajantes compartilharem seus planos, eles aparecerão
                aqui.
              </p>
            </div>
          ) : null}
          {!loadingOptions &&
          !loadingResults &&
          !error &&
          routes.length === 0 &&
          allRoutes.length > 0 ? (
            <div className="mt-6">
              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="font-bold text-slate-900">
                  Não encontramos roteiros que atendam a todos os filtros.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Estas sugestões recentes podem não atender a todos os
                  critérios selecionados.
                </p>
              </div>
              {recentAlternatives.length ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {recentAlternatives.map((route) => (
                    <PublicRouteCard key={route.id} route={route} suggestion />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  Não há outras sugestões disponíveis.
                </p>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
