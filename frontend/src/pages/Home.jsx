import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../data/api";
import RoteiroCard from "../components/RoteiroCard";
import UserAvatar from "../components/UserAvatar";
import { profilePath } from "../utils/profile";
import { formatCommunityDate } from "../utils/community";

const howItWorks = [
  [
    "01",
    "Encontre inspiração",
    "Pesquise por destino e veja roteiros compartilhados por viajantes.",
  ],
  [
    "02",
    "Organize sua viagem",
    "Consulte dias, horários, lugares e custos antes de montar seus planos.",
  ],
  [
    "03",
    "Compartilhe o que aprendeu",
    "Publique dicas para ajudar quem está planejando a próxima viagem.",
  ],
];

const faqs = [
  [
    "Preciso ter conta para explorar?",
    "Você pode conhecer a proposta e pesquisar roteiros públicos. Para abrir detalhes, salvar, avaliar ou interagir, é necessário entrar na sua conta.",
  ],
  [
    "Como salvo um roteiro para consultar depois?",
    "Abra um roteiro público e use o botão Salvar roteiro. Ele ficará na sua biblioteca privada de roteiros salvos.",
  ],
  [
    "Posso editar um roteiro de outra pessoa?",
    "O original é protegido. Use Copiar para editar para criar uma cópia privada sua; as alterações não afetam o roteiro publicado.",
  ],
  [
    "Como compartilho minha experiência?",
    "Entre na comunidade e publique uma dica ou relato. A comunidade está sendo construída para aproximar experiências e planejamento.",
  ],
];

function CommunityPreview({ post }) {
  const author = post.usuario || {};
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-center gap-3">
        <Link
          to={profilePath(author) || "/comunidade"}
          aria-label={`Ver perfil de ${author.nome || "viajante"}`}
        >
          <UserAvatar
            user={author}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={profilePath(author) || "/comunidade"}
            className="block truncate text-sm font-bold text-slate-900 hover:underline"
          >
            {author.nome || "Viajante"}
          </Link>
          <time className="text-xs text-slate-500" dateTime={post.criadoEm}>
            {formatCommunityDate(post.criadoEm)}
          </time>
        </div>
        <span className="text-xs text-rose-500">
          ♥ {post._count?.curtidas || 0}
        </span>
      </header>
      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {post.texto}
      </p>
      {post.roteiro?.publico ? (
        <Link
          to={`/roteiros/${post.roteiro.id}`}
          className="mt-3 block truncate rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
        >
          🧭 Roteiro: {post.roteiro.titulo}
        </Link>
      ) : null}
    </article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roteiros, setRoteiros] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [routesError, setRoutesError] = useState(null);
  const [postsError, setPostsError] = useState(null);

  useEffect(() => {
    apiFetch("/roteiros/populares")
      .then(setRoteiros)
      .catch((error) => setRoutesError(error.message))
      .finally(() => setLoadingRoutes(false));
    apiFetch("/publicacoes/timeline")
      .then((data) => setPosts(data.slice(0, 3)))
      .catch((error) => setPostsError(error.message))
      .finally(() => setLoadingPosts(false));
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    navigate(`/roteiros/publicos?busca=${encodeURIComponent(search.trim())}`);
  }

  return (
    <main className="site-shell overflow-hidden">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(56,189,248,0.38),transparent_28%),linear-gradient(120deg,#020617_0%,#172554_55%,#075985_100%)]" />
        <div className="relative mx-auto grid min-h-[68vh] max-w-[1280px] items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">
              Vambora · planeje com quem já foi
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
              Sua próxima viagem começa com informação de verdade.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Descubra roteiros, organize dias e atividades e aprenda com as
              experiências de outros viajantes.
            </p>
            <form
              onSubmit={submitSearch}
              className="mt-8 flex max-w-xl flex-col gap-2 rounded-3xl bg-white p-2 sm:flex-row"
            >
              <label className="sr-only" htmlFor="home-route-search">
                Pesquisar roteiros por destino
              </label>
              <input
                id="home-route-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Para onde você está planejando ir?"
                className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Pesquisar roteiros
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/roteiros/publicos"
                className="text-sm font-semibold text-cyan-200 hover:text-white hover:underline"
              >
                Explorar todos os roteiros →
              </Link>
              <Link
                to="/comunidade"
                className="text-sm font-semibold text-cyan-200 hover:text-white hover:underline"
              >
                Conhecer a comunidade →
              </Link>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">
              Planejamento mais simples
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-950/40 p-5">
                <p className="text-3xl font-black">{roteiros.length}</p>
                <p className="mt-1 text-sm text-slate-300">
                  roteiros em destaque
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/40 p-5">
                <p className="text-3xl font-black">{posts.length}</p>
                <p className="mt-1 text-sm text-slate-300">relatos recentes</p>
              </div>
            </div>
            <p className="mt-6 text-xl font-bold leading-7">
              Compare ideias, entenda cada dia e escolha o que faz sentido para
              sua viagem.
            </p>
          </div>
        </div>
      </section>

      <section
        className="container py-16 sm:py-20"
        aria-labelledby="popular-routes-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Inspiração da comunidade</p>
            <h2
              id="popular-routes-title"
              className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl"
            >
              Roteiros populares
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Roteiros em destaque para você comparar destinos, custos e
              avaliações.
            </p>
          </div>
          <Link to="/roteiros/publicos" className="btn-secondary">
            Ver todos
          </Link>
        </div>
        {loadingRoutes ? (
          <p className="mt-7 rounded-3xl bg-white p-6 text-sm text-slate-500">
            Buscando roteiros em destaque…
          </p>
        ) : null}
        {routesError ? (
          <p
            role="alert"
            className="mt-7 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
          >
            {routesError}
          </p>
        ) : null}
        {!loadingRoutes && !routesError && roteiros.length === 0 ? (
          <p className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
            Assim que houver roteiros públicos, eles aparecerão aqui.
          </p>
        ) : null}
        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {roteiros.slice(0, 3).map((roteiro) => (
            <RoteiroCard key={roteiro.id} roteiro={roteiro} publicOnly />
          ))}
        </div>
      </section>

      <section
        className="border-y border-slate-200 bg-white py-16 sm:py-20"
        id="como-funciona"
      >
        <div className="container">
          <p className="eyebrow">Um passo de cada vez</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Como o Vambora ajuda
          </h2>
          <div className="mt-8 grid gap-7 md:grid-cols-3">
            {howItWorks.map(([number, title, description]) => (
              <article
                key={number}
                className="rounded-3xl border border-slate-200 p-6"
              >
                <p className="text-sm font-black text-blue-600">{number}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="container grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]"
        id="sobre"
      >
        <div>
          <p className="eyebrow">Sobre nós</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Planejar não precisa ser complicado.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            O Vambora reúne roteiros organizados e experiências de viajantes
            para ajudar você a sair da dúvida e chegar a um plano que combine
            com seu tempo, destino e orçamento.
          </p>
          <p className="mt-3 leading-7 text-slate-600">
            A comunidade existe para trocar informação prática: o que visitar,
            como organizar os dias e o que considerar antes de viajar.
          </p>
          <Link to="/cadastro" className="btn-primary mt-6">
            Começar a planejar
          </Link>
        </div>
        <div className="rounded-[32px] bg-[#101B3D] p-7 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Feito para viajantes
          </p>
          <h3 className="mt-3 text-2xl font-black">
            Organize. Descubra. Compartilhe.
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Cada roteiro mostra atividades por dia, com horários e custos quando
            informados. Salve ideias úteis e conte sua experiência para ajudar
            outra pessoa.
          </p>
          <Link
            to="/comunidade"
            className="mt-6 inline-flex rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Abrir comunidade
          </Link>
        </div>
      </section>

      <section
        className="border-y border-slate-200 bg-white py-16 sm:py-20"
        aria-labelledby="community-preview-title"
      >
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Experiências compartilhadas</p>
              <h2
                id="community-preview-title"
                className="mt-3 text-3xl font-black text-slate-950"
              >
                Da comunidade
              </h2>
              <p className="mt-2 text-slate-600">
                Dicas e relatos que podem ajudar no seu próximo planejamento.
              </p>
            </div>
            <Link to="/comunidade" className="btn-secondary">
              Ver comunidade
            </Link>
          </div>
          {loadingPosts ? (
            <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              Carregando publicações recentes…
            </p>
          ) : null}
          {postsError ? (
            <p
              role="alert"
              className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800"
            >
              Não foi possível carregar as publicações neste momento.
            </p>
          ) : null}
          {!loadingPosts && !postsError && posts.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              As publicações da comunidade aparecerão aqui.
            </p>
          ) : null}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <CommunityPreview key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-20" id="faq">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">Perguntas frequentes</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Comece com o básico
          </h2>
          <div className="mt-7 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-5">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
                  <span>{question}</span>
                  <span className="text-xl text-blue-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-16 sm:pb-20">
        <div className="rounded-[32px] bg-gradient-to-r from-blue-700 to-cyan-600 px-7 py-9 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-100">
              Sua viagem começa aqui
            </p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Encontre um roteiro ou monte o seu.
            </h2>
          </div>
          <Link
            to="/roteiros/publicos"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 sm:mt-0"
          >
            Explorar roteiros
          </Link>
        </div>
      </section>
    </main>
  );
}
