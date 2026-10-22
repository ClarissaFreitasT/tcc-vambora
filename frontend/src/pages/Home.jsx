import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../data/api";
import { useAuth } from "../context/useAuth";
import ImageFallback from "../components/ImageFallback";
import RoteiroSearchPanel from "../components/RoteiroSearchPanel";
import {
  emptyRouteFilters,
  getRecentRouteSuggestions,
  getRouteCategories,
  getRouteDestinations,
} from "../utils/homeRoutes";
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

function HomeRouteCard({ route, recent = false }) {
  const reviews = Number(route.totalAvaliacoes || 0);
  return (
    <Link
      to={`/roteiros/${route.id}`}
      className={`home-route-card group relative isolate block h-[360px] overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-[0_20px_55px_rgba(15,23,42,.14)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${recent ? "home-route-card--recent" : ""}`}
    >
      <ImageFallback
        src={route.imagemUrl}
        alt={`Paisagem do roteiro para ${route.destino}`}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
      <div className="home-route-card-content absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="home-route-destination text-xs font-bold uppercase tracking-[.2em] text-cyan-200">
          {route.destino}
        </p>
        <h3 className="home-display mt-2 text-2xl font-black leading-tight text-white">
          {route.titulo}
        </h3>
        <p className="mt-2 text-sm text-white/75">
          Por {route.usuario?.nome || "Viajante Vambora"}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/20 pt-3 text-sm font-medium text-white/90">
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

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [roteiros, setRoteiros] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routesError, setRoutesError] = useState(null);
  const [globeStatus, setGlobeStatus] = useState("loading");
  const [globeInteractive, setGlobeInteractive] = useState(false);
  const globeRef = useRef(null);
  const routeRailRef = useRef(null);
  const [filters, setFilters] = useState({ ...emptyRouteFilters });

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

  useEffect(() => {
    let active = true;
    async function loadSections() {
      const routeResult = await Promise.allSettled([
        apiFetch("/roteiros/publicos"),
      ]);
      if (!active) return;
      if (routeResult[0].status === "fulfilled")
        setRoteiros(routeResult[0].value);
      else setRoutesError(routeResult[0].reason.message);
      setLoadingRoutes(false);
    }
    loadSections();
    return () => {
      active = false;
    };
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
      const header = document.querySelector("nav");
      const isSticky = header && getComputedStyle(header).position === "sticky";
      headerHeight = isSticky ? header.getBoundingClientRect().height : 0;
      shell?.style.setProperty(
        "--home-screen-height",
        `${Math.max(1, window.innerHeight - headerHeight)}px`,
      );
      const previousTransform = globe.style.transform;
      globe.style.transform = "none";
      const rect = globe.getBoundingClientRect();
      globe.style.transform = previousTransform;
      naturalCenterX = rect.left + window.scrollX + rect.width / 2;
      naturalCenterY = rect.top + window.scrollY + rect.height / 2;
      sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const diameter = Math.min(
        window.innerWidth * 0.5,
        (window.innerHeight - headerHeight) * 0.95,
      );
      startScale = diameter / Math.max(rect.height * 0.86, 1);
    };

    const updatePosition = () => {
      animationFrame = 0;
      const viewportCenterY =
        headerHeight + (window.innerHeight - headerHeight) / 2;
      const transitionEnd = Math.max(1, sectionTop - headerHeight);
      const rawProgress = Math.min(
        1,
        Math.max(0, window.scrollY / transitionEnd),
      );
      const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
      const naturalScreenX = naturalCenterX - window.scrollX;
      const naturalScreenY = naturalCenterY - window.scrollY;
      const targetCenterX =
        window.innerWidth + (naturalScreenX - window.innerWidth) * progress;
      const targetCenterY =
        viewportCenterY - Math.max(0, window.scrollY - transitionEnd);
      const offsetX = targetCenterX - naturalScreenX;
      const offsetY = targetCenterY - naturalScreenY;
      const scale = startScale + (1 - startScale) * progress;
      globe.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`;
    };

    const scheduleUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updatePosition);
      }
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

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setGlobeInteractive(entry.isIntersecting);
      },
      { threshold: 0.62 },
    );
    observer.observe(globe);
    return () => observer.disconnect();
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
  function submitSearch(nextFilters) {
    setFilters({ ...nextFilters, categoriaIds: [...nextFilters.categoriaIds] });
    const params = new URLSearchParams();
    if (nextFilters.destino.trim())
      params.set("destino", nextFilters.destino.trim());
    if (nextFilters.orcamentoMin)
      params.set("orcamentoMin", nextFilters.orcamentoMin);
    if (nextFilters.orcamentoMax)
      params.set("orcamentoMax", nextFilters.orcamentoMax);
    if (nextFilters.dias) params.set("dias", nextFilters.dias);
    if (nextFilters.avaliacaoMin)
      params.set("avaliacaoMin", nextFilters.avaliacaoMin);
    if (nextFilters.categoriaIds.length)
      params.set("categorias", nextFilters.categoriaIds.join(","));
    navigate(
      `/roteiros/publicos${params.toString() ? `?${params.toString()}` : ""}`,
    );
  }

  function createRoute() {
    if (isAuthenticated) navigate("/roteiros/novo");
    else navigate("/login", { state: { from: "/roteiros/novo" } });
  }

  function scrollRoutes(direction) {
    routeRailRef.current?.scrollBy({
      left: direction * Math.min(routeRailRef.current.clientWidth * 0.8, 520),
      behavior: "smooth",
    });
  }

  return (
    <main className="site-shell home-page overflow-hidden">
      <section className="home-hero-section relative isolate overflow-hidden bg-[#07182e] text-white">
        <ImageFallback
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=85"
          alt="Paisagem litorânea ao entardecer"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061629]/95 via-[#082044]/75 to-[#082044]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061629]/85 via-transparent to-[#061629]/15" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:py-16">
          <div className="home-hero-content max-w-3xl">
            <h1 className="home-display mt-4 max-w-2xl text-4xl leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Sua próxima viagem fica melhor quando a gente planeja junto.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-100 sm:text-lg sm:leading-8">
              Encontre roteiros de verdade, organize sua viagem e aprenda com as
              experiências de quem já foi.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={createRoute}
                className="rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-200"
              >
                Criar roteiro
              </button>
            </div>
            <div className="mt-8 max-w-3xl">
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
        </div>
      </section>

      <section
        className="home-globe-section"
        aria-labelledby="home-globe-title"
      >
        <div className="container grid items-center gap-6 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <div className="home-globe-copy">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              O mundo em perspectiva
            </p>
            <h2
              id="home-globe-title"
              className="home-display mt-3 text-3xl text-white sm:text-4xl"
            >
              Sua próxima descoberta pode estar em qualquer lugar.
            </h2>
            <Link
              to="/roteiros/publicos"
              className="btn-primary mt-6 inline-flex"
            >
              Explorar roteiros
            </Link>
          </div>
          <div
            ref={globeRef}
            className="home-globe-float"
            aria-label="Globo terrestre decorativo"
          >
            <div className="home-globe-stage">
              <Suspense
                fallback={
                  <div className="home-globe-loading" role="status">
                    Preparando o globo 3D…
                  </div>
                }
              >
                <GlobeCanvas
                  destinations={[]}
                  allDestinations={[]}
                  selectedDestinationId={null}
                  routeDestinationIds={[]}
                  autoRotate={globeInteractive}
                  interactionEnabled={globeInteractive}
                  onStatus={setGlobeStatus}
                />
              </Suspense>
            </div>
            {globeStatus !== "ready" ? (
              <p
                className={`home-globe-status ${globeStatus === "loading" ? "" : "is-warning"}`}
                role={globeStatus === "loading" ? "status" : "alert"}
              >
                {globeStatus === "loading"
                  ? "Carregando textura terrestre…"
                  : globeStatus}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="home-popular-section container py-14 sm:py-20"
        aria-labelledby="popular-routes-title"
      >
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="popular-routes-title"
                className="home-display mt-2 text-3xl font-black text-slate-950 sm:text-4xl"
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
              <div className="home-route-rail-wrap mt-7">
                <button
                  type="button"
                  className="home-route-arrow home-route-arrow-left"
                  aria-label="Ver roteiros anteriores"
                  onClick={() => scrollRoutes(-1)}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <div ref={routeRailRef} className="home-route-rail">
                  <HomeRouteCard
                    route={featuredRoutes[0].route}
                    recent={featuredRoutes[0].recent}
                  />
                  {featuredRoutes.slice(1).map(({ route, recent }) => (
                    <HomeRouteCard
                      key={route.id}
                      route={route}
                      recent={recent}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="home-route-arrow home-route-arrow-right"
                  aria-label="Ver mais roteiros"
                  onClick={() => scrollRoutes(1)}
                >
                  <span aria-hidden="true">→</span>
                </button>
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
        className="home-process-section py-14 sm:py-20"
        aria-labelledby="how-it-works-title"
      >
        <div className="container mx-auto max-w-[1280px]">
          <div className="home-process-heading">
            <div>
              <h2
                id="how-it-works-title"
                className="home-display mt-2 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                Como funciona
              </h2>
            </div>
          </div>
          <div className="home-process-list mt-7">
            {[
              [
                "01",
                "Encontre seu próximo roteiro",
                "Inspire-se em viagens planejadas e compartilhadas por outros viajantes.",
              ],
              [
                "02",
                "Planeje do seu jeito",
                "Organize os dias, as atividades e os custos da sua viagem em um só lugar.",
              ],
              [
                "03",
                "Descubra com outros viajantes",
                "Encontre dicas e experiências que podem ajudar você a viajar melhor.",
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
        className="home-community-section container py-16 sm:py-24"
        aria-labelledby="community-preview-title"
      >
        <div className="mx-auto max-w-[1080px]">
          <div className="home-community-intro flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="home-section-kicker home-community-kicker">
                Comunidade
              </p>
              <h2
                id="community-preview-title"
                className="home-display mt-2 text-3xl font-black text-slate-950"
              >
                Viagens reais, experiências compartilhadas.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Descubra dicas, relatos e descobertas de quem também ama
                explorar novos lugares.
              </p>
            </div>
            <Link to="/comunidade" className="btn-primary">
              Bora conhecer a Comunidade{" "}
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
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
