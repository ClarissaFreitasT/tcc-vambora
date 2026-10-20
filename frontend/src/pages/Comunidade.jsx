import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserAvatar from "../components/UserAvatar";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CommunityPost from "../components/CommunityPost";
import Feedback from "../components/Feedback";
import { apiFetch } from "../data/api";
import { useAuth } from "../context/useAuth";
import { filterTravelers, updatePostLike } from "../utils/community";
import { profilePath } from "../utils/profile";

export default function Comunidade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPublicationId = searchParams.get("publicacao");
  const { user, isAuthenticated } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [publicacoes, setPublicacoes] = useState([]);
  const [roteirosVinculaveis, setRoteirosVinculaveis] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedPostCategoryIds, setSelectedPostCategoryIds] = useState([]);
  const [search, setSearch] = useState("");
  const [postText, setPostText] = useState("");
  const [selectedRoteiroId, setSelectedRoteiroId] = useState("");
  const [feedMode, setFeedMode] = useState("for-you");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [feedError, setFeedError] = useState(null);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(null);
  const [followingBusy, setFollowingBusy] = useState([]);
  const [likesBusy, setLikesBusy] = useState([]);
  const [savesBusy, setSavesBusy] = useState([]);
  const [deletingPosts, setDeletingPosts] = useState([]);
  const [openComments, setOpenComments] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsLoading, setCommentsLoading] = useState([]);
  const [commentsErrors, setCommentsErrors] = useState({});
  const [moderationReports, setModerationReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const feedRequest = useRef(false);
  const feedRequestId = useRef(0);
  const nextCursorRef = useRef(null);
  const feedEndRef = useRef(null);
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

  const loadFeed = useCallback(
    async ({ append = false } = {}) => {
      if ((append && feedRequest.current) || (append && !nextCursorRef.current))
        return;
      feedRequest.current = true;
      const requestId = ++feedRequestId.current;
      if (append) setLoadingMore(true);
      else setLoadingFeed(true);
      setFeedError(null);
      try {
        const path =
          feedMode === "following"
            ? "/publicacoes/feed"
            : "/publicacoes/timeline";
        const query = new URLSearchParams({ limit: "12" });
        if (append && nextCursorRef.current)
          query.set("cursor", nextCursorRef.current);
        if (selectedCategoryIds.length)
          query.set("categorias", selectedCategoryIds.join(","));
        const page = await apiFetch(`${path}?${query.toString()}`);
        if (requestId !== feedRequestId.current) return;
        setPublicacoes((current) => {
          const incoming = page.items;
          if (!append) return incoming;
          const ids = new Set(current.map((post) => post.id));
          return [...current, ...incoming.filter((post) => !ids.has(post.id))];
        });
        nextCursorRef.current = page.nextCursor || null;
        setNextCursor(page.nextCursor || null);
      } catch (error) {
        if (requestId !== feedRequestId.current) return;
        setFeedError(error.message);
        setStatus({ type: "error", message: error.message });
      } finally {
        if (requestId === feedRequestId.current) {
          feedRequest.current = false;
          setLoadingFeed(false);
          setLoadingMore(false);
        }
      }
    },
    [feedMode, selectedCategoryIds],
  );

  useEffect(() => {
    loadUsers();
    apiFetch("/publicacoes/categorias")
      .then(setCategories)
      .catch(() => setCategories([]));
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

  useEffect(() => {
    if (!requestedPublicationId) return undefined;
    let active = true;
    async function loadRequestedPublication() {
      try {
        await loadFeed();
        const post = await apiFetch(`/publicacoes/${requestedPublicationId}`);
        if (!active) return;
        setPublicacoes((current) => [
          post,
          ...current.filter((item) => item.id !== post.id),
        ]);
        setOpenComments((current) =>
          current.includes(post.id) ? current : [...current, post.id],
        );
        try {
          const comments = await apiFetch(
            `/publicacoes/${requestedPublicationId}/comentarios`,
          );
          if (!active) return;
          setCommentsByPost((current) => ({ ...current, [post.id]: comments }));
        } catch (error) {
          if (active)
            setCommentsErrors((current) => ({
              ...current,
              [post.id]: error.message,
            }));
        }
        window.requestAnimationFrame(() =>
          document.getElementById(`community-post-${post.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        );
      } catch (error) {
        if (active) setStatus({ type: "error", message: error.message });
      }
    }
    loadRequestedPublication();
    return () => {
      active = false;
    };
  }, [loadFeed, requestedPublicationId]);

  const loadModerationReports = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setReportsLoading(true);
    setReportsError(null);
    try {
      setModerationReports(await apiFetch("/publicacoes/admin/denuncias"));
    } catch (error) {
      setReportsError(error.message);
    } finally {
      setReportsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "ADMIN") loadModerationReports();
  }, [loadModerationReports, user?.role]);

  useEffect(() => {
    const target = feedEndRef.current;
    if (!target || typeof IntersectionObserver === "undefined")
      return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          nextCursor &&
          !loadingFeed &&
          !loadingMore
        )
          loadFeed({ append: true });
      },
      { rootMargin: "500px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadFeed, loadingFeed, loadingMore, nextCursor]);

  function toggleCategory(categoryId) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  const filteredUsers = useMemo(() => {
    return filterTravelers(
      usuarios.filter((traveler) => traveler.id !== user?.id),
      search,
    );
  }, [search, user?.id, usuarios]);

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
        body: JSON.stringify({
          texto,
          roteiroId: selectedRoteiroId || null,
          categoriaIds: selectedPostCategoryIds,
        }),
      });
      setPostText("");
      setSelectedRoteiroId("");
      setSelectedPostCategoryIds([]);
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

  async function toggleSave(post) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/comunidade" } });
      return;
    }
    if (savesBusy.includes(post.id)) return;
    setSavesBusy((current) => [...current, post.id]);
    try {
      const saved = !post.salvo;
      await apiFetch(`/publicacoes/${post.id}/salvar`, {
        method: saved ? "POST" : "DELETE",
      });
      setPublicacoes((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, salvo: saved } : item,
        ),
      );
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSavesBusy((current) => current.filter((id) => id !== post.id));
    }
  }

  async function loadLikes(postId) {
    return apiFetch(`/publicacoes/${postId}/curtidas`);
  }

  async function deleteOwnPublication(postId) {
    if (deletingPosts.includes(postId)) return false;
    setDeletingPosts((current) => [...current, postId]);
    try {
      await apiFetch(`/publicacoes/${postId}`, { method: "DELETE" });
      setPublicacoes((current) => current.filter((post) => post.id !== postId));
      setStatus({ type: "success", message: "Publicação excluída." });
      return true;
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      return false;
    } finally {
      setDeletingPosts((current) => current.filter((id) => id !== postId));
    }
  }

  async function reportPublication(postId, motivo, detalhe) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/comunidade" } });
      return false;
    }
    try {
      await apiFetch(`/publicacoes/${postId}/denunciar`, {
        method: "POST",
        body: JSON.stringify({ motivo, detalhe }),
      });
      setStatus({ type: "success", message: "Denúncia enviada para análise." });
      return true;
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      return false;
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
    let result;
    try {
      result = await apiFetch(`/publicacoes/${postId}/comentarios`, {
        method: "POST",
        body: JSON.stringify({ texto, comentarioPaiId }),
      });
    } catch (error) {
      setCommentsErrors((current) => ({ ...current, [postId]: error.message }));
      return false;
    }

    const createdComment = result.comentario
      ? {
          ...result.comentario,
          usuario: user
            ? {
                id: user.id,
                nome: user.nome,
                username: user.username,
                fotoUrl: user.fotoUrl,
              }
            : null,
        }
      : null;
    setCommentsByPost((current) => {
      const existing = current[postId] || [];
      if (
        !createdComment ||
        existing.some((comment) => comment.id === createdComment.id)
      )
        return current;
      return { ...current, [postId]: [...existing, createdComment] };
    });
    setPublicacoes((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        const count = post._count?.comentarios || 0;
        const nextComments = createdComment
          ? [...(commentsByPost[postId] || []), createdComment]
          : commentsByPost[postId] || [];
        return {
          ...post,
          comentarios: nextComments
            .filter((comment) => !comment.comentarioPaiId)
            .slice(-2)
            .reverse(),
          _count: { ...post._count, comentarios: count + 1 },
        };
      }),
    );
    setCommentsErrors((current) => ({ ...current, [postId]: null }));

    try {
      const comments = await apiFetch(`/publicacoes/${postId}/comentarios`);
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
      setPublicacoes((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: comments
                  .filter((comment) => !comment.comentarioPaiId)
                  .slice(-2)
                  .reverse(),
                _count: { ...post._count, comentarios: comments.length },
              }
            : post,
        ),
      );
      return true;
    } catch (error) {
      setCommentsErrors((current) => ({
        ...current,
        [postId]: `Comentário publicado, mas a conversa não pôde ser atualizada: ${error.message}`,
      }));
      return true;
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
      await loadModerationReports();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function updateModerationReport(reportId, state) {
    try {
      await apiFetch(`/publicacoes/admin/denuncias/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ estado: state }),
      });
      setModerationReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, estado: state } : report,
        ),
      );
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
                comentarios: comments
                  .filter((comment) => !comment.comentarioPaiId)
                  .slice(-2)
                  .reverse(),
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

  function selectFeedMode(mode) {
    if (mode === "following" && !user) {
      navigate("/login", { state: { from: "/comunidade" } });
      return;
    }
    setFeedMode(mode);
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto grid w-full max-w-[1040px] grid-cols-1 items-start gap-0 px-0 lg:grid-cols-[minmax(0,680px)_280px] lg:gap-6 lg:px-4">
        <section
          aria-labelledby="community-heading"
          className="min-w-0 border-y border-slate-200 lg:border-x lg:border-y-0"
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
                  Compartilhe experiências, dicas e roteiros de viagem.
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
                Explorar
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
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={selectedPostCategoryIds.includes(
                        category.id,
                      )}
                      onClick={() =>
                        setSelectedPostCategoryIds((current) =>
                          current.includes(category.id)
                            ? current.filter((id) => id !== category.id)
                            : [...current, category.id],
                        )
                      }
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${selectedPostCategoryIds.includes(category.id) ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      {category.nome}
                    </button>
                  ))}
                </div>
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

          <div
            className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 sm:px-6"
            aria-label="Filtrar publicações por categoria"
          >
            <span className="mr-1 text-xs font-bold text-slate-500">
              Categorias
            </span>
            <button
              type="button"
              aria-pressed={selectedCategoryIds.length === 0}
              onClick={() => setSelectedCategoryIds([])}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selectedCategoryIds.length === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={selectedCategoryIds.includes(category.id)}
                onClick={() => toggleCategory(category.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selectedCategoryIds.includes(category.id) ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {category.nome}
              </button>
            ))}
          </div>

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
          {!loadingFeed && feedError ? (
            <div className="border-b border-slate-200 px-6 py-12 text-center">
              <p className="text-sm text-red-700" role="alert">
                Não foi possível carregar as publicações: {feedError}
              </p>
              <button
                type="button"
                onClick={loadFeed}
                className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!loadingFeed && !feedError && publicacoes.length === 0 ? (
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
              isOwnPost={post.usuarioId === user?.id}
              isFollowing={Boolean(
                usuarios.find((traveler) => traveler.id === post.usuarioId)
                  ?.seguindo,
              )}
              followBusy={followingBusy.includes(post.usuarioId)}
              canFollow={post.usuarioId !== user?.id}
              onToggleFollow={() => {
                const author = usuarios.find(
                  (traveler) => traveler.id === post.usuarioId,
                );
                if (author) toggleFollow(author);
              }}
              comments={commentsByPost[post.id] || []}
              commentsOpen={openComments.includes(post.id)}
              commentsLoading={commentsLoading.includes(post.id)}
              commentsError={commentsErrors[post.id]}
              likeBusy={likesBusy.includes(post.id)}
              onToggleLike={() => toggleLike(post)}
              onToggleSave={() => toggleSave(post)}
              saveBusy={savesBusy.includes(post.id)}
              onLoadLikes={() => loadLikes(post.id)}
              onDeletePost={() => deleteOwnPublication(post.id)}
              deleteBusy={deletingPosts.includes(post.id)}
              onReport={(reason, detail) =>
                reportPublication(post.id, reason, detail)
              }
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
          {loadingMore ? (
            <p
              className="border-b border-slate-200 px-6 py-5 text-center text-sm text-slate-500"
              role="status"
            >
              Buscando mais publicações…
            </p>
          ) : null}
          <div ref={feedEndRef} aria-hidden="true" className="h-1" />
          {!loadingFeed && publicacoes.length > 0 && !nextCursor ? (
            <p className="px-6 py-6 text-center text-xs text-slate-400">
              Você chegou ao fim das publicações.
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 px-4 py-5 sm:px-6 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-72px)] lg:overflow-y-auto lg:px-0">
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

          {user?.role === "ADMIN" ? (
            <section className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50/70">
              <div className="flex items-center justify-between gap-2 px-5 py-4">
                <h2 className="text-base font-extrabold text-slate-900">
                  Denúncias da comunidade
                </h2>
                <button
                  type="button"
                  onClick={loadModerationReports}
                  disabled={reportsLoading}
                  aria-label="Atualizar denúncias"
                  className="rounded-full px-2 py-1 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  ⟳
                </button>
              </div>
              {reportsLoading ? (
                <p className="px-5 pb-4 text-sm text-slate-500">
                  Carregando denúncias…
                </p>
              ) : null}
              {reportsError ? (
                <div className="px-5 pb-4 text-sm text-red-700">
                  <p role="alert">{reportsError}</p>
                  <button
                    type="button"
                    onClick={loadModerationReports}
                    className="mt-2 font-bold underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : null}
              {!reportsLoading &&
              !reportsError &&
              moderationReports.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-slate-500">
                  Nenhuma denúncia registrada.
                </p>
              ) : null}
              <div className="divide-y divide-amber-200">
                {moderationReports.slice(0, 8).map((report) => (
                  <article key={report.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-extrabold text-slate-800">
                        {report.motivo}
                      </p>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                        {report.estado === "EM_ANALISE"
                          ? "Em análise"
                          : report.estado === "TRATADA"
                            ? "Tratada"
                            : "Aberta"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Denunciada por{" "}
                      {report.usuario?.nome || "usuário indisponível"}
                    </p>
                    {report.detalhe ? (
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {report.detalhe}
                      </p>
                    ) : null}
                    {report.publicacao ? (
                      <p className="mt-2 line-clamp-3 rounded-xl bg-white/80 p-2.5 text-xs leading-5 text-slate-700">
                        {report.publicacao.texto}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs italic text-slate-500">
                        A publicação já foi removida; o registro da denúncia foi
                        preservado.
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.publicacao ? (
                        <button
                          type="button"
                          onClick={() =>
                            removePublicationAsAdmin(report.publicacao.id)
                          }
                          className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50"
                        >
                          Remover publicação
                        </button>
                      ) : null}
                      {report.estado === "ABERTA" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateModerationReport(report.id, "EM_ANALISE")
                          }
                          className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                        >
                          Em análise
                        </button>
                      ) : null}
                      {report.estado !== "TRATADA" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateModerationReport(report.id, "TRATADA")
                          }
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-700"
                        >
                          Concluir
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
              {moderationReports.length > 8 ? (
                <p className="px-5 py-3 text-xs text-slate-500">
                  Mostrando 8 de {moderationReports.length} denúncias.
                </p>
              ) : null}
            </section>
          ) : null}

          <footer className="px-2 text-xs leading-5 text-slate-400">
            VAMBORA · Compartilhe viagens, respeite a comunidade e descubra
            novos caminhos.
          </footer>
        </aside>
      </div>
    </main>
  );
}
