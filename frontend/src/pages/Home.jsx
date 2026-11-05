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
import RoteiroPublicoCard from "../components/RoteiroPublicoCard";
import {
  emptyRouteFilters,
  getRouteCategories,
  getRouteDestinations,
} from "../utils/homeRoutes";
import "./Home.css";
import "./RoteirosPublicos.css";

const GlobeCanvas = lazy(() => import("../components/GlobeCanvas.jsx"));

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [roteiros, setRoteiros] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routesError, setRoutesError] = useState(null);
  const [globeStatus, setGlobeStatus] = useState("loading");
  const [globeInteractive, setGlobeInteractive] = useState(false);
  const globeRef = useRef(null);
  const routeRailRef = useRef(null);
  const [filters, setFilters] = useState({ ...emptyRouteFilters });
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
        .filter((route) => Number(route.totalAvaliacoes || 0) >= 3)
        .sort(
          (a, b) => Number(b.popularidade || 0) - Number(a.popularidade || 0),
        ),
    [roteiros],
  );
  const featuredRoutes = popularRoutes.slice(0, 4);
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
    const rail = routeRailRef.current;
    const card = rail?.firstElementChild;
    if (!rail || !card) return;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
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
                submitLabel="Vambora!"
                homeLayout
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
            <h2
              id="home-globe-title"
              className="home-display mt-3 text-3xl text-white sm:text-4xl"
            >
              Tem sempre um novo destino esperando por você.
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
        <div className="home-popular-layout mx-auto max-w-[1280px]">
          <div className="home-popular-aside">
            <div className="home-popular-heading">
              <h2
                id="popular-routes-title"
                className="home-display mt-2 text-3xl font-black text-slate-950 sm:text-4xl"
              >
                Roteiros populares
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Veja quais roteiros estão recebendo as melhores avaliações.
              </p>
            </div>
          </div>
          <div className="home-popular-content">
            {loadingRoutes ? (
              <div
                className="home-route-loading mt-9"
                role="status"
                aria-label="Carregando roteiros populares"
              >
                <div className="home-route-skeleton" />
                <div className="home-route-skeleton" />
                <div className="home-route-skeleton" />
                <div className="home-route-skeleton" />
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
            {!loadingRoutes && !routesError && featuredRoutes.length === 0 ? (
              <div className="home-popular-empty-state mt-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-bold text-slate-800">
                  Ainda não há roteiros mais votados por aqui.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Seja uma das primeiras pessoas a avaliar um roteiro e ajude a
                  comunidade a descobrir boas opções!
                </p>
              </div>
            ) : null}
            {!loadingRoutes && !routesError && featuredRoutes.length ? (
              <div className="home-route-rail-wrap">
                <button
                  type="button"
                  className="home-route-arrow home-route-arrow-left"
                  aria-label="Ver roteiros anteriores"
                  onClick={() => scrollRoutes(-1)}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <div ref={routeRailRef} className="home-route-rail">
                  {featuredRoutes.map((route) => (
                    <RoteiroPublicoCard
                      key={route.id}
                      route={route}
                      isAuthenticated={isAuthenticated}
                      saved={savedRouteIds.includes(route.id)}
                      savedLoading={savedRoutesLoading}
                      onSavedChange={updateSavedRoute}
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
            ) : null}
          </div>
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
                Descubra, planeje e faça parte
              </h2>
              <p className="home-process-intro">
                Encontre novas ideias para viajar, organize seus planos e
                conecte-se com pessoas que também gostam de conhecer o mundo.
              </p>
            </div>
          </div>
          <div className="home-process-list mt-7">
            {[
              [
                "01",
                "Descubra novos lugares",
                "Explore destinos e conheça roteiros compartilhados por outros viajantes.",
              ],
              [
                "02",
                "Planeje do seu jeito",
                "Crie seu roteiro, organize atividades por dia e acompanhe os custos da viagem.",
              ],
              [
                "03",
                "Faça parte da comunidade",
                "Acompanhe outros viajantes, compartilhe suas publicações e troque dicas e experiências.",
              ],
            ].map(([number, title, description]) => (
              <article
                key={number}
                className={`home-process-step home-process-step--${number} flex gap-4 border-l-2 border-cyan-300 pl-4`}
              >
                <span className="home-process-number" aria-hidden="true">
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
        <div className="home-community-layout mx-auto max-w-[1180px]">
          <div className="home-community-intro">
            <div className="home-community-copy">
              <h2
                id="community-preview-title"
                className="home-display mt-2 text-3xl font-black text-slate-950"
              >
                Conheça quem também gosta de viajar.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Veja publicações, compartilhe suas viagens e troque dicas com
                outros viajantes.
              </p>
              <Link to="/comunidade" className="home-community-link">
                Vem pra comunidade <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div
              className="home-community-mosaic"
              aria-label="Fotografias de destinos compartilhados pela comunidade"
            >
              <figure className="home-mosaic-photo home-mosaic-photo--one">
                <ImageFallback
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85"
                  alt="Mar azul e areia clara em um destino tropical"
                  className="home-mosaic-image"
                />
                <figcaption>Um lugar para desacelerar</figcaption>
              </figure>
              <figure className="home-mosaic-photo home-mosaic-photo--two">
                <ImageFallback
                  src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85"
                  alt="Rua tradicional entre casas e vegetação"
                  className="home-mosaic-image"
                />
                <figcaption>Ruas que contam histórias</figcaption>
              </figure>
              <figure className="home-mosaic-photo home-mosaic-photo--three">
                <ImageFallback
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85"
                  alt="Montanhas altas em uma paisagem natural"
                  className="home-mosaic-image"
                />
                <figcaption>O caminho também é destino</figcaption>
              </figure>
              <figure className="home-mosaic-photo home-mosaic-photo--four">
                <ImageFallback
                  src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85"
                  alt="Paisagem urbana europeia ao fim da tarde"
                  className="home-mosaic-image"
                />
                <figcaption>Novas perspectivas</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <svg
          className="home-footer-wave"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 80V43Q180 2 360 43T720 43T1080 43T1440 43V80Z" />
        </svg>
        <div className="home-footer-content text-sm">
          <Link
            to="/"
            className="home-footer-brand"
            aria-label="Vambora! Página inicial"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo-vambora.png`}
              alt=""
              className="home-footer-logo"
            />
          </Link>
          <p className="text-slate-500">Planeje junto. Viaje melhor.</p>
        </div>
      </footer>
    </main>
  );
}
