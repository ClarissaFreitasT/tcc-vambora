import { useCallback, useEffect, useMemo, useState } from "react";
import UserAvatar from "../components/UserAvatar";
import { Link, useNavigate } from "react-router-dom";
import CommunityPost from "../components/CommunityPost";
import Feedback from "../components/Feedback";
import { apiFetch } from "../data/api";
import { useAuth } from "../context/useAuth";
import { filterTravelers, updatePostLike } from "../utils/community";
import { profilePath } from "../utils/profile";

const navigationItems = [
  { label: "Página inicial", href: "/", icon: "⌂" },
  { label: "Comunidade", href: "/comunidade", icon: "◉" },
  { label: "Explorar roteiros", href: "/roteiros/publicos", icon: "⌕" },
];

export default function Comunidade() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [publicacoes, setPublicacoes] = useState([]);
  const [roteirosVinculaveis, setRoteirosVinculaveis] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [search, setSearch] = useState("");
  const [postText, setPostText] = useState("");
  const [selectedRoteiroId, setSelectedRoteiroId] = useState("");
  const [feedMode, setFeedMode] = useState("for-you");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(null);
  const [followingBusy, setFollowingBusy] = useState([]);
  const [likesBusy, setLikesBusy] = useState([]);
  const [openComments, setOpenComments] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsLoading, setCommentsLoading] = useState([]);
  const [commentsErrors, setCommentsErrors] = useState({});

  const visibleNavigationItems = isAuthenticated
    ? [
        ...navigationItems,
        { label: "Meus roteiros", href: "/roteiros", icon: "⌖" },
        { label: "Meu perfil", href: "/perfil", icon: "◉" },
      ]
    : [...navigationItems, { label: "Entrar", href: "/login", icon: "⇥" }];

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setUsuarios(await apiFetch("/usuarios"));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const path =
        feedMode === "following"
          ? "/publicacoes/feed"
          : "/publicacoes/timeline";
      setPublicacoes(await apiFetch(path));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoadingFeed(false);
    }
  }, [feedMode]);

  useEffect(() => {
    loadUsers();
    apiFetch("/roteiros/publicos")
      .then((roteiros) => {
        const counts = roteiros.reduce((result, roteiro) => {
          const destino = roteiro.destino?.trim();
          if (destino) result.set(destino, (result.get(destino) || 0) + 1);
          return result;
        }, new Map());
        setDestinos(
          [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
            .slice(0, 5),
        );
      })
      .catch(() => setDestinos([]));
  }, [loadUsers]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRoteirosVinculaveis([]);
      return;
    }
    apiFetch("/roteiros")
      .then((items) =>
        setRoteirosVinculaveis(items.filter((item) => item.publico)),
      )
      .catch(() => setRoteirosVinculaveis([]));
  }, [isAuthenticated]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const filteredUsers = useMemo(() => {
    return filterTravelers(
      usuarios.filter((traveler) => traveler.id !== user?.id),
      search,
    );
  }, [search, user?.id, usuarios]);

  const followedCount = usuarios.filter((traveler) => traveler.seguindo).length;

  async function publishPost(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/comunidade" } });
      return;
    }
    const texto = postText.trim();
    if (!texto || posting) return;

    setPosting(true);
    setStatus(null);
    try {
      await apiFetch("/publicacoes", {
        method: "POST",
        body: JSON.stringify({ texto, roteiroId: selectedRoteiroId || null }),
      });
      setPostText("");
      setSelectedRoteiroId("");
      setStatus({ type: "success", message: "Publicação enviada." });
      await loadFeed();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setPosting(false);
    }
  }

  async function toggleFollow(traveler) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/comunidade" } });
      return;
    }
    if (followingBusy.includes(traveler.id)) return;
    setFollowingBusy((current) => [...current, traveler.id]);
    setStatus(null);
    try {
      const following = !traveler.seguindo;
      await apiFetch(`/usuarios/${traveler.id}/seguir`, {
        method: following ? "POST" : "DELETE",
      });
      setUsuarios((current) =>
        current.map((item) =>
          item.id === traveler.id
            ? {
                ...item,
                seguindo: following,
                totalSeguidores: Math.max(
                  0,
                  (item.totalSeguidores || 0) + (following ? 1 : -1),
                ),
              }
            : item,
        ),
      );
      if (feedMode === "following") await loadFeed();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setFollowingBusy((current) => current.filter((id) => id !== traveler.id));
    }
  }

  async function toggleLike(post) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/comunidade" } });
      return;
    }
    if (likesBusy.includes(post.id)) return;
    setLikesBusy((current) => [...current, post.id]);
    try {
      const liked = !post.curtiu;
      const result = await apiFetch(`/publicacoes/${post.id}/curtir`, {
        method: liked ? "POST" : "DELETE",
      });
      setPublicacoes((current) =>
        updatePostLike(current, post.id, liked, result.totalCurtidas),
      );
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLikesBusy((current) => current.filter((id) => id !== post.id));
    }
  }

  async function toggleComments(postId) {
    if (openComments.includes(postId)) {
      setOpenComments((current) => current.filter((id) => id !== postId));
      return;
    }
    setOpenComments((current) => [...current, postId]);
    if (Object.hasOwn(commentsByPost, postId)) return;

    setCommentsLoading((current) => [...current, postId]);
    setCommentsErrors((current) => ({ ...current, [postId]: null }));
    try {
      const comments = await apiFetch(`/publicacoes/${postId}/comentarios`);
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
    } catch (error) {
      setCommentsErrors((current) => ({ ...current, [postId]: error.message }));
    } finally {
      setCommentsLoading((current) => current.filter((id) => id !== postId));
    }
  }

  async function addComment(postId, texto, comentarioPaiId = null) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/comunidade" } });
      return false;
    }
    try {
      await apiFetch(`/publicacoes/${postId}/comentarios`, {
        method: "POST",
        body: JSON.stringify({ texto, comentarioPaiId }),
      });
      const comments = await apiFetch(`/publicacoes/${postId}/comentarios`);
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
      setPublicacoes((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                _count: { ...post._count, comentarios: comments.length },
              }
            : post,
        ),
      );
      return true;
    } catch (error) {
      setCommentsErrors((current) => ({ ...current, [postId]: error.message }));
      return false;
    }
  }

  async function removePublicationAsAdmin(postId) {
    if (user?.role !== "ADMIN") return;
    if (!window.confirm("Remover esta publicação da comunidade?")) return;
    try {
      await apiFetch(`/publicacoes/admin/${postId}`, { method: "DELETE" });
      setPublicacoes((current) => current.filter((post) => post.id !== postId));
      setStatus({
        type: "success",
        message: "Publicação removida pela moderação.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function removeCommentAsAdmin(commentId, postId) {
    if (user?.role !== "ADMIN") return false;
    try {
      await apiFetch(`/publicacoes/comentarios/${commentId}/admin`, {
        method: "DELETE",
      });
      const comments = await apiFetch(`/publicacoes/${postId}/comentarios`);
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
      setPublicacoes((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                _count: { ...post._count, comentarios: comments.length },
              }
            : post,
        ),
      );
      setStatus({
        type: "success",
        message: "Comentário removido pela moderação.",
      });
      return true;
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      return false;
    }
  }

  function focusComposer() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/comunidade" } });
      return;
    }
    document.getElementById("community-post")?.focus();
  }

  function selectFeedMode(mode) {
    if (mode === "following" && !user) {
      navigate("/login", { state: { from: "/comunidade" } });
      return;
    }
    setFeedMode(mode);
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-start xl:grid-cols-[220px_minmax(0,640px)_320px]">
        <aside className="hidden min-h-[calc(100vh-72px)] border-r border-slate-200 px-3 py-5 xl:sticky xl:top-[72px] xl:block">
          <Link
            to="/comunidade"
            className="flex h-12 items-center gap-3 rounded-full px-4 text-xl font-black tracking-tight text-slate-950 hover:bg-slate-100"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-lg text-white">
              ✈
            </span>
            Vambora
          </Link>
          <nav aria-label="Navegação da comunidade" className="mt-6 space-y-1">
            {visibleNavigationItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-4 rounded-full px-4 py-3 text-[15px] transition hover:bg-slate-100 ${item.href === "/comunidade" ? "font-extrabold" : "font-medium"}`}
              >
                <span
                  aria-hidden="true"
                  className="w-7 text-center text-2xl leading-none"
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={focusComposer}
            className="mt-6 w-full rounded-full bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Publicar
          </button>
          <div className="mt-10 rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-bold">Sua comunidade de viagem</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {followedCount} viajantes no seu círculo · {usuarios.length}{" "}
              perfis para descobrir
            </p>
          </div>
        </aside>

        <section
          aria-labelledby="community-heading"
          className="min-w-0 border-x border-slate-200"
        >
          <header className="sticky top-[72px] z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1
                  id="community-heading"
                  className="text-xl font-extrabold tracking-tight"
                >
                  Comunidade
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  {user?.nome
                    ? `Olá, ${user.nome.split(" ")[0]}`
                    : "Conversas de viajantes"}
                </p>
              </div>
              <button
                type="button"
                onClick={loadFeed}
                disabled={loadingFeed}
                aria-label="Atualizar timeline"
                className="grid h-10 w-10 place-items-center rounded-full text-xl text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
              >
                ⟳
              </button>
            </div>
            <div
              role="tablist"
              aria-label="Timeline"
              className="-mb-3 mt-3 grid grid-cols-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={feedMode === "for-you"}
                onClick={() => selectFeedMode("for-you")}
                className={`relative px-3 py-4 text-sm transition hover:bg-slate-50 ${feedMode === "for-you" ? "font-extrabold text-slate-950" : "font-medium text-slate-500"}`}
              >
                Para você
                {feedMode === "for-you" ? (
                  <span className="absolute inset-x-10 bottom-0 h-1 rounded-full bg-blue-600" />
                ) : null}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={feedMode === "following"}
                onClick={() => selectFeedMode("following")}
                className={`relative px-3 py-4 text-sm transition hover:bg-slate-50 ${feedMode === "following" ? "font-extrabold text-slate-950" : "font-medium text-slate-500"}`}
              >
                Seguindo
                {feedMode === "following" ? (
                  <span className="absolute inset-x-10 bottom-0 h-1 rounded-full bg-blue-600" />
                ) : null}
              </button>
            </div>
          </header>

          {isAuthenticated ? (
            <form
              onSubmit={publishPost}
              className="flex gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5"
            >
              <UserAvatar
                user={user}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <label htmlFor="community-post" className="sr-only">
                  O que está acontecendo?
                </label>
                <textarea
                  id="community-post"
                  rows={3}
                  maxLength={2000}
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  placeholder="O que está acontecendo na sua viagem?"
                  className="w-full resize-none border-0 bg-transparent py-1 text-lg leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                />
                {roteirosVinculaveis.length ? (
                  <label className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <span aria-hidden="true">🧭</span>
                    Vincular um roteiro seu
                    <select
                      value={selectedRoteiroId}
                      onChange={(event) =>
                        setSelectedRoteiroId(event.target.value)
                      }
                      className="max-w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
                    >
                      <option value="">Sem roteiro vinculado</option>
                      {roteirosVinculaveis.map((roteiro) => (
                        <option key={roteiro.id} value={roteiro.id}>
                          {roteiro.titulo} · {roteiro.destino}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400">
                    Compartilhe uma dica, história ou descoberta.
                  </span>
                  <button
                    type="submit"
                    disabled={posting || !postText.trim()}
                    className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {posting ? "Enviando…" : "Publicar"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-5 sm:px-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-xl">
                ✈️
              </span>
              <p className="flex-1 text-sm text-slate-600">
                Entre para compartilhar suas histórias de viagem.
              </p>
              <Link
                to="/login"
                state={{ from: "/comunidade" }}
                className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Entrar
              </Link>
            </div>
          )}

          {status ? (
            <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
              <Feedback status={status} onDismiss={() => setStatus(null)} />
            </div>
          ) : null}

          {loadingFeed ? (
            <div className="border-b border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
              Carregando publicações…
            </div>
          ) : null}
          {!loadingFeed && publicacoes.length === 0 ? (
            <div className="border-b border-slate-200 px-6 py-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-2xl">
                ✈️
              </div>
              <h2 className="mt-4 text-lg font-extrabold">
                {feedMode === "following"
                  ? "Seu feed está quietinho"
                  : "A timeline está começando"}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {feedMode === "following"
                  ? "Siga viajantes para acompanhar as dicas e histórias deles por aqui."
                  : "Seja a primeira pessoa a compartilhar uma dica de viagem com a comunidade."}
              </p>
              {feedMode === "following" ? (
                <button
                  type="button"
                  onClick={() => setFeedMode("for-you")}
                  className="mt-4 text-sm font-bold text-blue-600 hover:underline"
                >
                  Explorar todas as publicações
                </button>
              ) : null}
            </div>
          ) : null}
          {publicacoes.map((post) => (
            <CommunityPost
              key={post.id}
              post={post}
              isAuthenticated={isAuthenticated}
              isAdmin={user?.role === "ADMIN"}
              comments={commentsByPost[post.id] || []}
              commentsOpen={openComments.includes(post.id)}
              commentsLoading={commentsLoading.includes(post.id)}
              commentsError={commentsErrors[post.id]}
              likeBusy={likesBusy.includes(post.id)}
              onToggleLike={() => toggleLike(post)}
              onToggleComments={() => toggleComments(post.id)}
              onAddComment={(text, parentId) =>
                addComment(post.id, text, parentId)
              }
              onAdminDeletePost={() => removePublicationAsAdmin(post.id)}
              onAdminDeleteComment={(commentId) =>
                removeCommentAsAdmin(commentId, post.id)
              }
            />
          ))}
        </section>

        <aside className="space-y-4 px-4 py-5 sm:px-6 xl:sticky xl:top-[72px] xl:max-h-[calc(100vh-72px)] xl:overflow-y-auto xl:px-5">
          <label className="flex items-center gap-3 rounded-full bg-slate-100 px-5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500">
            <span aria-hidden="true" className="text-lg text-slate-500">
              ⌕
            </span>
            <span className="sr-only">Buscar viajantes</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar viajantes"
              className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-500 focus:ring-0"
            />
          </label>

          <section className="overflow-hidden rounded-3xl bg-slate-50">
            <h2 className="px-5 py-4 text-xl font-extrabold tracking-tight">
              Quem seguir
            </h2>
            <div className="divide-y divide-slate-200">
              {loadingUsers ? (
                <p className="px-5 py-5 text-sm text-slate-500">
                  Buscando viajantes…
                </p>
              ) : null}
              {!loadingUsers && filteredUsers.length === 0 ? (
                <p className="px-5 py-5 text-sm text-slate-500">
                  Nenhum viajante encontrado.
                </p>
              ) : null}
              {filteredUsers.slice(0, 6).map((traveler) => (
                <div
                  key={traveler.id}
                  className="flex items-center gap-3 px-4 py-4"
                >
                  <Link
                    to={profilePath(traveler)}
                    className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Ver perfil de ${traveler.nome}`}
                  >
                    <UserAvatar
                      user={traveler}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    {profilePath(traveler) ? (
                      <Link
                        to={profilePath(traveler)}
                        className="block truncate text-sm font-bold hover:underline"
                      >
                        {traveler.nome}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-bold">
                        {traveler.nome}
                      </p>
                    )}
                    {traveler.username ? (
                      <Link
                        to={profilePath(traveler)}
                        className="block truncate text-xs text-slate-500 hover:underline"
                      >
                        @{traveler.username}
                      </Link>
                    ) : (
                      <p className="truncate text-xs text-slate-500">
                        {traveler.bio || "Viajante"}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFollow(traveler)}
                    disabled={followingBusy.includes(traveler.id)}
                    aria-label={`${traveler.seguindo ? "Deixar de seguir" : "Seguir"} ${traveler.nome}`}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${traveler.seguindo ? "border border-slate-300 bg-white text-slate-800 hover:border-red-300 hover:text-red-600" : "bg-slate-950 text-white hover:bg-slate-700"}`}
                  >
                    {followingBusy.includes(traveler.id)
                      ? "…"
                      : traveler.seguindo
                        ? "Seguindo"
                        : "Seguir"}
                  </button>
                </div>
              ))}
            </div>
            {filteredUsers.length > 6 ? (
              <p className="px-5 pb-4 text-xs text-slate-500">
                Refine a busca para encontrar mais perfis.
              </p>
            ) : null}
            <Link
              to="/perfil"
              className="block border-t border-slate-200 px-5 py-4 text-sm font-semibold text-blue-600 hover:bg-slate-100"
            >
              Completar meu perfil
            </Link>
          </section>

          <section className="overflow-hidden rounded-3xl bg-slate-50">
            <h2 className="px-5 py-4 text-xl font-extrabold tracking-tight">
              Destinos em alta
            </h2>
            {destinos.length ? (
              destinos.map(([destino, total]) => (
                <Link
                  key={destino}
                  to={`/roteiros/publicos?busca=${encodeURIComponent(destino)}`}
                  className="block px-5 py-3 transition hover:bg-slate-100"
                >
                  <p className="text-xs text-slate-500">
                    Tendência em roteiros
                  </p>
                  <p className="mt-1 font-bold">{destino}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {total} {total === 1 ? "roteiro" : "roteiros"} públicos
                  </p>
                </Link>
              ))
            ) : (
              <p className="px-5 pb-5 text-sm text-slate-500">
                Destinos aparecem aqui quando a comunidade publicar roteiros.
              </p>
            )}
            <Link
              to="/roteiros/publicos"
              className="block border-t border-slate-200 px-5 py-4 text-sm font-semibold text-blue-600 hover:bg-slate-100"
            >
              Explorar roteiros
            </Link>
          </section>

          <footer className="px-2 text-xs leading-5 text-slate-400">
            VAMBORA · Compartilhe viagens, respeite a comunidade e descubra
            novos caminhos.
          </footer>
        </aside>
      </div>
    </main>
  );
}
