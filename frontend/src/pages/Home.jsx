import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../data/api";
import { useAuth } from "../context/useAuth";
import ImageFallback from "../components/ImageFallback";
import RoteiroSearchPanel from "../components/RoteiroSearchPanel";
import {
  emptyRouteFilters,
  filterHomeRoutes,
  getRecentRouteSuggestions,
  getRouteCategories,
  getRouteDestinations,
} from "../utils/homeRoutes";
import { formatCommunityDate } from "../utils/community";
import { destinosGlobo } from "../data/destinosGlobo";
import "./Home.css";

const GlobeCanvas = lazy(() => import("../components/GlobeCanvas.jsx"));

function formatMoney(value) {
  if (value === null || value === undefined || value === "")
    return "Orçamento não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function routeDays(route) {
  return route.totalDias ?? route.dias?.length ?? 0;
}

function formatRouteDays(route) {
  const total = routeDays(route);
  if (!total) return "Duração não informada";
  return `${total} ${total === 1 ? "dia" : "dias"}`;
}

function HomeRouteCard({ route, featured = false, recent = false }) {
  const reviews = Number(route.totalAvaliacoes || 0);
  return (
    <Link
      to={`/roteiros/${route.id}`}
      className={`group relative isolate block min-h-64 overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-[0_20px_55px_rgba(15,23,42,.14)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${featured ? "min-h-[440px] lg:min-h-[530px]" : "min-h-[300px]"}`}
    >
      <ImageFallback
        src={route.imagemUrl}
        alt={`Paisagem do roteiro para ${route.destino}`}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-slate-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-white/90 backdrop-blur">
            {recent ? "Roteiro recente" : "Popular entre viajantes"}
          </span>
          {reviews === 0 ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur">
              Ainda sem avaliações
            </span>
          ) : null}
        </div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-200">
          {route.destino}
        </p>
        <h3
          className={`${featured ? "mt-2 text-3xl sm:text-4xl" : "mt-2 text-2xl"} font-black leading-tight text-white`}
        >
          {route.titulo}
        </h3>
        <p className="mt-2 text-sm text-white/75">
          Por {route.usuario?.nome || "Viajante Vambora"}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/20 pt-3 text-xs font-medium text-white/90">
          {reviews ? (
            <span>
              ★ {Number(route.mediaAvaliacao).toFixed(1)}{" "}
              <span className="text-white/65">({reviews})</span>
            </span>
          ) : (
            <span>Ainda sem avaliações</span>
          )}
          <span>{formatMoney(route.orcamento)}</span>
          <span>{formatRouteDays(route)}</span>
          <span aria-label={`${route.totalCurtidas || 0} curtidas`}>
            ♥ {route.totalCurtidas || 0}
          </span>
        </div>
        <span className="sr-only">Abrir roteiro completo</span>
      </div>
    </Link>
  );
}

function CommunityPreview({ post }) {
  const image = post.fotos?.[0]?.url;
  return (
    <Link
      to={`/comunidade?publicacao=${encodeURIComponent(post.id)}`}
      className="group flex min-w-0 gap-4 border-b border-slate-200 py-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-3"
      aria-label={`Abrir publicação de ${post.usuario?.nome || "viajante"}`}
    >
      {image ? (
        <ImageFallback
          src={image}
          alt="Foto da publicação"
          className="h-20 w-24 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-32"
        />
      ) : (
        <div
          className="grid h-20 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 text-3xl text-blue-700 sm:h-24 sm:w-32"
          aria-hidden="true"
        >
          ✈
        </div>
      )}
      <div className="min-w-0 py-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="font-bold text-slate-800">
            {post.usuario?.nome || "Viajante"}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.criadoEm}>
            {formatCommunityDate(post.criadoEm)}
          </time>
        </div>
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-slate-700 group-hover:text-slate-950">
          {post.texto}
        </p>
        {post.roteiro?.publico ? (
          <span className="mt-2 inline-block text-xs font-semibold text-blue-700">
            Roteiro: {post.roteiro.titulo}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function filterChips(filters, categories) {
  const chips = [];
  if (filters.destino)
    chips.push({ key: "destino", label: `Destino: ${filters.destino}` });
  if (filters.orcamentoMin)
    chips.push({
      key: "orcamentoMin",
      label: `Mín. ${formatMoney(filters.orcamentoMin)}`,
    });
  if (filters.orcamentoMax)
    chips.push({
      key: "orcamentoMax",
      label: `Máx. ${formatMoney(filters.orcamentoMax)}`,
    });
  if (filters.dias)
    chips.push({
      key: "dias",
      label: `${filters.dias} ${filters.dias === "1" ? "dia" : "dias"}`,
    });
  if (filters.avaliacaoMin)
    chips.push({
      key: "avaliacaoMin",
      label: `${filters.avaliacaoMin}+ estrelas`,
    });
  filters.categoriaIds.forEach((id) => {
    const category = categories.find((item) => item.id === id);
    if (category) chips.push({ key: `categoria:${id}`, label: category.nome });
  });
  return chips;
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [roteiros, setRoteiros] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [routesError, setRoutesError] = useState(null);
  const [postsError, setPostsError] = useState(null);
  const [globeStatus, setGlobeStatus] = useState("loading");
  const [globeInteractive, setGlobeInteractive] = useState(false);
  const globeRef = useRef(null);
  const [filters, setFilters] = useState({ ...emptyRouteFilters });
  const [appliedFilters, setAppliedFilters] = useState(null);

  async function loadRoutes() {
    setLoadingRoutes(true);
    setRoutesError(null);
    try {
      setRoteiros(await apiFetch("/roteiros/publicos"));
    } catch (error) {
      setRoutesError(error.message);
    } finally {
      setLoadingRoutes(false);
    }
  }

  async function loadPosts() {
    setLoadingPosts(true);
    setPostsError(null);
    try {
      const data = await apiFetch("/publicacoes/timeline");
      setPosts(
        Array.isArray(data) ? data.slice(0, 4) : (data.items || []).slice(0, 4),
      );
    } catch (error) {
      setPostsError(error.message);
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadSections() {
      const [routeResult, postResult] = await Promise.allSettled([
        apiFetch("/roteiros/publicos"),
        apiFetch("/publicacoes/timeline"),
      ]);
      if (!active) return;
      if (routeResult.status === "fulfilled") setRoteiros(routeResult.value);
      else setRoutesError(routeResult.reason.message);
      setLoadingRoutes(false);
      if (postResult.status === "fulfilled") {
        const data = postResult.value;
        setPosts(
          Array.isArray(data)
            ? data.slice(0, 4)
            : (data.items || []).slice(0, 4),
        );
      } else setPostsError(postResult.reason.message);
      setLoadingPosts(false);
    }
    loadSections();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setGlobeInteractive(entry.isIntersecting);
    }, { threshold: 0.62 });
    observer.observe(globe);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const globe = globeRef.current;
    const section = globe?.closest(".home-globe-section");
    if (!globe || !section) return undefined;
    const shell = globe.closest(".site-shell");
    let animationFrame = 0;
    let naturalCenterX = 0;
    let naturalCenterY = 0;
    let startScale = 1;
    let sectionTop = 0;
    let headerHeight = 0;

    const measureLayout = () => {
      const header = document.querySelector("header") || document.querySelector("nav");
      const position = header ? getComputedStyle(header).position : "static";
      headerHeight = position === "sticky" || position === "fixed"
        ? header.getBoundingClientRect().height
        : 0;
      shell?.style.setProperty("--home-screen-height", `${Math.max(1, window.innerHeight - headerHeight)}px`);
      const previousTransform = globe.style.transform;
      globe.style.transform = "none";
      const rect = globe.getBoundingClientRect();
      globe.style.transform = previousTransform;
      naturalCenterX = rect.left + window.scrollX + rect.width / 2;
      naturalCenterY = rect.top + window.scrollY + rect.height / 2;
      sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const diameter = Math.min(window.innerWidth * 0.5, (window.innerHeight - headerHeight) * 0.95);
      startScale = diameter / Math.max(rect.height * 0.86, 1);
    };

    const updatePosition = () => {
      animationFrame = 0;
      const viewportCenterY = headerHeight + (window.innerHeight - headerHeight) / 2;
      const transitionEnd = Math.max(1, sectionTop - headerHeight);
      const rawProgress = Math.min(1, Math.max(0, window.scrollY / transitionEnd));
      const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
      const naturalScreenX = naturalCenterX - window.scrollX;
      const naturalScreenY = naturalCenterY - window.scrollY;
      const targetCenterX = window.innerWidth + (naturalScreenX - window.innerWidth) * progress;
      const targetCenterY = viewportCenterY - Math.max(0, window.scrollY - transitionEnd);
      const offsetX = targetCenterX - naturalScreenX;
      const offsetY = targetCenterY - naturalScreenY;
      const scale = startScale + (1 - startScale) * progress;
      globe.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`;
    };
    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updatePosition);
    };
    const handleResize = () => {
      measureLayout();
      scheduleUpdate();
    };

    measureLayout();
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrame);
      globe.style.transform = "";
      shell?.style.removeProperty("--home-screen-height");
    };
  }, []);

  const categories = useMemo(() => getRouteCategories(roteiros), [roteiros]);
  const destinations = useMemo(
    () => getRouteDestinations(roteiros),
    [roteiros],
  );
  const popularRoutes = useMemo(
    () =>
      roteiros
        .filter(
          (route) =>
            Number(route.totalCurtidas || 0) +
              Number(route.totalAvaliacoes || 0) +
              Number(route.totalUsos || 0) >
            0,
        )
        .sort(
          (a, b) => Number(b.popularidade || 0) - Number(a.popularidade || 0),
        ),
    [roteiros],
  );
  const featuredPopular = popularRoutes.slice(0, 4);
  const recentRoutes = getRecentRouteSuggestions(
    roteiros,
    featuredPopular.map((route) => route.id),
    Math.max(0, 4 - featuredPopular.length),
  );
  const featuredRoutes = [
    ...featuredPopular.map((route) => ({ route, recent: false })),
    ...recentRoutes.map((route) => ({ route, recent: true })),
  ];
  const searchResults = useMemo(
    () => (appliedFilters ? filterHomeRoutes(roteiros, appliedFilters) : []),
    [appliedFilters, roteiros],
  );
  const alternativeRoutes = useMemo(
    () =>
      appliedFilters && searchResults.length === 0
        ? getRecentRouteSuggestions(roteiros, [], 4)
        : [],
    [appliedFilters, roteiros, searchResults.length],
  );
  const activeChips = appliedFilters
    ? filterChips(appliedFilters, categories)
    : [];

  function submitSearch(nextFilters) {
    setFilters({ ...nextFilters, categoriaIds: [...nextFilters.categoriaIds] });
    setAppliedFilters({
      ...nextFilters,
      categoriaIds: [...nextFilters.categoriaIds],
    });
  }

  function removeAppliedFilter(key) {
    const next = { ...appliedFilters };
    if (key.startsWith("categoria:")) {
      const id = key.slice("categoria:".length);
      next.categoriaIds = next.categoriaIds.filter((item) => item !== id);
    } else {
      next[key] = "";
    }
    setFilters(next);
    setAppliedFilters(next);
  }

  function clearSearch() {
    const cleared = { ...emptyRouteFilters, categoriaIds: [] };
    setFilters(cleared);
    setAppliedFilters(cleared);
  }

  function createRoute() {
    if (isAuthenticated) navigate("/roteiros/novo");
    else navigate("/login", { state: { from: "/roteiros/novo" } });
  }

  return (
    <main className="site-shell overflow-hidden">
      <section className="home-hero-section relative isolate overflow-hidden bg-[#07182e] text-white">
        <ImageFallback
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=85"
          alt="Paisagem litorânea ao entardecer"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061629]/95 via-[#082044]/75 to-[#082044]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061629]/85 via-transparent to-[#061629]/15" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.27em] text-cyan-200 sm:text-sm">
              Vambora · viagens planejadas em comunidade
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Sua próxima viagem fica melhor quando a gente planeja junto.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-100 sm:text-lg sm:leading-8">
              Encontre roteiros de verdade, organize sua viagem e aprenda com as
              experiências de quem já foi.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={createRoute}
                className="rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-200"
              >
                Criar roteiro
              </button>
              <Link
                to="/roteiros/publicos"
                className="rounded-full border border-white/50 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Explorar roteiros
              </Link>
            </div>
            <div className="mt-8 max-w-2xl lg:col-span-2 lg:row-start-2 lg:max-w-none">
              <RoteiroSearchPanel
                destinations={destinations}
                categories={categories}
                value={filters}
                onChange={setFilters}
                onSubmit={submitSearch}
                busy={loadingRoutes}
                submitLabel="Buscar"
              />
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-xl lg:col-start-2 lg:row-start-1 lg:block">
            <div className="absolute -inset-6 rounded-[36px] bg-cyan-200/15 blur-3xl" />
            <div className="relative rotate-[1deg] rounded-[30px] border border-white/35 bg-white/95 p-5 text-slate-900 shadow-[0_35px_100px_rgba(0,0,0,.4)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-blue-700">
                    Prévia ilustrativa
                  </p>
                  <h2 className="mt-1 text-lg font-black">
                    Seu próximo roteiro
                  </h2>
                </div>
                <span
                  className="grid h-10 w-10 place-items-center rounded-full bg-cyan-100 text-xl"
                  aria-hidden="true"
                >
                  ✈
                </span>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-200 via-sky-100 to-blue-200 p-5">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-900/70">
                  Destino · dias · atividades
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  Uma viagem com a sua cara
                </p>
                <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-black text-blue-700">
                    1
                  </span>
                  <span className="self-center font-semibold text-slate-700">
                    Organize as ideias do dia
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-black text-blue-700">
                    2
                  </span>
                  <span className="self-center font-semibold text-slate-700">
                    Compare dicas e custos
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-black text-blue-700">
                    3
                  </span>
                  <span className="self-center font-semibold text-slate-700">
                    Compartilhe com viajantes
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-2">
                  Roteiros públicos
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-2">
                  Planejamento por dia
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-2">
                  Comunidade viajante
                </span>
              </div>
            </div>
            <p className="relative mt-4 text-center text-xs font-medium text-white/80">
              Encontre inspiração e transforme ideias em um plano.
            </p>
          </div>
        </div>
      </section>

      <section className="home-globe-section" aria-labelledby="home-globe-title">
        <div className="container grid items-center gap-6 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <div className="home-globe-copy">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">O mundo em perspectiva</p>
            <h2 id="home-globe-title" className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Sua próxima descoberta pode estar em qualquer lugar.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-300">
              {globeInteractive
                ? "Gire o planeta e passe pelos pontos para conhecer os destinos."
                : "Continue descendo: o globo acompanha a página e fica interativo quando chegar até ele."}
            </p>
            <Link to="/explorar" className="btn-primary mt-6 inline-flex">Explorar destinos</Link>
          </div>
          <div ref={globeRef} className="home-globe-float" aria-label="Globo terrestre interativo">
            <div className="home-globe-label"><span /> {destinosGlobo.length} DESTINOS PARA DESCOBRIR</div>
            <div className="home-globe-stage">
              <Suspense fallback={<div className="home-globe-loading" role="status">Preparando o globo 3D…</div>}>
                <GlobeCanvas
                  destinations={destinosGlobo}
                  allDestinations={destinosGlobo}
                  selectedDestinationId={null}
                  routeDestinationIds={[]}
                  autoRotate={globeInteractive}
                  interactionEnabled={globeInteractive}
                  onSelectDestination={() => navigate("/explorar")}
                  onStatus={setGlobeStatus}
                />
              </Suspense>
            </div>
            {globeStatus !== "ready" ? (
              <p className={`home-globe-status ${globeStatus === "loading" ? "" : "is-warning"}`} role={globeStatus === "loading" ? "status" : "alert"}>
                {globeStatus === "loading" ? "Carregando textura terrestre…" : globeStatus}
              </p>
            ) : null}
            <p className="home-globe-hint">
              {globeInteractive
                ? "Arraste para girar · passe sobre os pontos para ver os destinos"
                : "Desça a página para liberar a interação com o globo"}
            </p>
          </div>
        </div>
      </section>

      {appliedFilters ? (
        <section
          className="border-b border-slate-200 bg-slate-50 px-4 py-10 sm:px-6"
          aria-live="polite"
          aria-labelledby="home-search-results-title"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Sua busca</p>
                <h2
                  id="home-search-results-title"
                  className="mt-2 text-2xl font-black text-slate-950"
                >
                  {searchResults.length
                    ? `${searchResults.length} roteiros encontrados`
                    : "Não encontramos roteiros com todos esses filtros"}
                </h2>
              </div>
              <button
                type="button"
                onClick={clearSearch}
                className="text-sm font-bold text-blue-700 hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeAppliedFilter(chip.key)}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                >
                  {chip.label} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            {loadingRoutes ? (
              <p className="mt-6 text-sm text-slate-500" role="status">
                Carregando roteiros para sua busca…
              </p>
            ) : null}
            {routesError ? (
              <p className="mt-6 text-sm text-red-700" role="alert">
                Não foi possível pesquisar roteiros: {routesError}
              </p>
            ) : null}
            {!loadingRoutes && !routesError && searchResults.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.slice(0, 6).map((route) => (
                  <HomeRouteCard key={route.id} route={route} recent={false} />
                ))}
              </div>
            ) : null}
            {!loadingRoutes && !routesError && searchResults.length === 0 ? (
              <div className="mt-6">
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Não há correspondências que atendam a todos os filtros
                  selecionados. Estas sugestões recentes podem não atender a
                  todos os critérios:
                </p>
                {alternativeRoutes.length ? (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {alternativeRoutes.map((route) => (
                      <HomeRouteCard key={route.id} route={route} recent />
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                    Ainda não há roteiros públicos para sugerir. Que tal criar o
                    primeiro?
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section
        className="container py-14 sm:py-16"
        aria-labelledby="popular-routes-title"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Inspiração para começar</p>
              <h2
                id="popular-routes-title"
                className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl"
              >
                Roteiros populares
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Experiências que viajantes curtiram, avaliaram ou escolheram
                como ponto de partida.
              </p>
            </div>
          </div>
          {loadingRoutes ? (
            <div
              className="mt-7 grid gap-5 lg:grid-cols-2"
              role="status"
              aria-label="Carregando roteiros populares"
            >
              <div className="h-80 animate-pulse rounded-[28px] bg-slate-100" />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="h-60 animate-pulse rounded-[28px] bg-slate-100" />
                <div className="h-60 animate-pulse rounded-[28px] bg-slate-100" />
              </div>
            </div>
          ) : null}
          {routesError ? (
            <div className="mt-7 rounded-2xl bg-red-50 p-5 text-sm text-red-800">
              <p role="alert">
                Não foi possível carregar os roteiros: {routesError}
              </p>
              <button
                type="button"
                onClick={loadRoutes}
                className="mt-2 font-bold underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!loadingRoutes && !routesError && roteiros.length === 0 ? (
            <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-bold text-slate-800">
                Ainda não há roteiros públicos.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Seja a primeira pessoa a criar e compartilhar um roteiro.
              </p>
              <button
                type="button"
                onClick={createRoute}
                className="btn-primary mt-5"
              >
                Criar o primeiro roteiro
              </button>
            </div>
          ) : null}
          {!loadingRoutes && !routesError && featuredRoutes.length ? (
            <>
              <div className="mt-7 grid gap-5 lg:grid-cols-[1.12fr_.88fr]">
                <HomeRouteCard
                  route={featuredRoutes[0].route}
                  featured
                  recent={featuredRoutes[0].recent}
                />
                <div className="grid gap-5">
                  {featuredRoutes.slice(1).map(({ route, recent }) => (
                    <HomeRouteCard
                      key={route.id}
                      route={route}
                      recent={recent}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-8 text-center">
                <Link
                  to="/roteiros/publicos"
                  className="inline-flex rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-400 hover:text-blue-700"
                >
                  Ver todos os roteiros{" "}
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section
        className="border-y border-slate-200 bg-slate-50 py-12 sm:py-14"
        aria-labelledby="how-it-works-title"
      >
        <div className="container mx-auto max-w-[1280px]">
          <p className="eyebrow">Do primeiro passo à próxima viagem</p>
          <h2
            id="how-it-works-title"
            className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl"
          >
            Como funciona
          </h2>
          <div className="mt-7 grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              [
                "01",
                "Encontre roteiros",
                "Inspire-se em planos compartilhados por viajantes.",
              ],
              [
                "02",
                "Organize sua viagem",
                "Use dias, atividades e custos para montar seu planejamento.",
              ],
              [
                "03",
                "Aprenda e compartilhe",
                "Aproveite dicas da comunidade e conte o que descobriu.",
              ],
            ].map(([number, title, description]) => (
              <article
                key={number}
                className="flex gap-4 border-l-2 border-cyan-300 pl-4"
              >
                <span className="text-sm font-black text-blue-700">
                  {number}
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="container py-14 sm:py-16"
        aria-labelledby="community-preview-title"
      >
        <div className="mx-auto max-w-[1080px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Dicas e experiências compartilhadas</p>
              <h2
                id="community-preview-title"
                className="mt-2 text-3xl font-black text-slate-950"
              >
                Da comunidade
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Um pouco do que viajantes estão contando.
              </p>
            </div>
            <Link
              to="/comunidade"
              className="text-sm font-bold text-blue-700 hover:underline"
            >
              Abrir Comunidade <span aria-hidden="true">→</span>
            </Link>
          </div>
          {loadingPosts ? (
            <div
              className="mt-5 space-y-3"
              role="status"
              aria-label="Carregando publicações"
            >
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : null}
          {postsError ? (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <p role="alert">
                Não foi possível carregar as publicações da Comunidade.
              </p>
              <button
                type="button"
                onClick={loadPosts}
                className="mt-2 font-bold underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!loadingPosts && !postsError && posts.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-cyan-50 p-6 text-sm leading-6 text-slate-700">
              A Comunidade ainda não tem publicações. Compartilhe uma dica ou
              experiência para começar a conversa.
              <div>
                <Link
                  to="/comunidade"
                  className="mt-3 inline-block font-bold text-blue-700 hover:underline"
                >
                  Conhecer a Comunidade
                </Link>
              </div>
            </div>
          ) : null}
          {!loadingPosts && !postsError && posts.length ? (
            <div className="mt-4">
              {posts.map((post) => (
                <CommunityPreview key={post.id} post={post} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 text-sm">
          <Link to="/" className="font-black tracking-tight text-slate-900">
            ✈ VAMBORA
          </Link>
          <p className="text-slate-500">Planeje junto. Viaje melhor.</p>
          <Link
            to="/comunidade"
            className="font-semibold text-blue-700 hover:underline"
          >
            Comunidade
          </Link>
        </div>
      </footer>
    </main>
  );
}
