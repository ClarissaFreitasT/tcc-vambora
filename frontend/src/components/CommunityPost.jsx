import { useEffect, useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import { Link } from "react-router-dom";
import { formatCommunityDate } from "../utils/community";
import { profilePath } from "../utils/profile";
import { apiAssetUrl } from "../data/api";

export default function CommunityPost({
  post,
  isAuthenticated,
  isAdmin = false,
  isOwnPost = false,
  isFollowing = false,
  followBusy = false,
  canFollow = false,
  onToggleFollow,
  comments,
  commentsOpen,
  commentsLoading,
  commentsError,
  likeBusy,
  onToggleLike,
  onToggleSave,
  saveBusy = false,
  onLoadLikes,
  onDeletePost,
  deleteBusy = false,
  onReport,
  onToggleComments,
  onAddComment,
  onAdminDeletePost,
  onAdminDeleteComment,
}) {
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteCancelRef = useRef(null);
  const deleteMenuButtonRef = useRef(null);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likedBy, setLikedBy] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const author = post.usuario || {};
  const authorProfilePath = profilePath(author);
  const likeCount = post._count?.curtidas || 0;
  const commentCount = post._count?.comentarios || 0;

  useEffect(() => {
    if (!deleteConfirmOpen) return undefined;
    deleteCancelRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === "Escape" && !confirmingDelete) {
        setDeleteConfirmOpen(false);
        deleteMenuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [confirmingDelete, deleteConfirmOpen]);

  async function confirmDelete() {
    if (confirmingDelete || deleteBusy) return;
    setConfirmingDelete(true);
    await onDeletePost?.();
    setConfirmingDelete(false);
    setDeleteConfirmOpen(false);
  }

  async function submitComment(event) {
    event.preventDefault();
    const text = commentText.trim();
    if (!text || sendingComment) return;
    setSendingComment(true);
    const saved = await onAddComment(text, replyTo?.id || null);
    if (saved) {
      setCommentText("");
      setReplyTo(null);
    }
    setSendingComment(false);
  }

  async function showLikes() {
    setLikesOpen(true);
    setLikesLoading(true);
    setLikesError(null);
    try {
      setLikedBy(await onLoadLikes());
    } catch (error) {
      setLikesError(error.message);
    } finally {
      setLikesLoading(false);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!reportReason || sendingReport) return;
    setSendingReport(true);
    const sent = await onReport(reportReason, reportDetail.trim());
    setSendingReport(false);
    if (sent) {
      setReportOpen(false);
      setReportReason("");
      setReportDetail("");
      setMenuOpen(false);
    }
  }

  return (
    <article
      id={`community-post-${post.id}`}
      className="border-b border-slate-200 px-4 py-5 transition hover:bg-slate-50/60 sm:px-6"
    >
      <div className="flex items-start gap-3">
        <Link
          to={authorProfilePath || "/comunidade"}
          onClick={(event) => {
            if (!authorProfilePath) event.preventDefault();
          }}
          aria-label={
            authorProfilePath ? `Ver perfil de ${author.nome}` : undefined
          }
          className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <UserAvatar
            user={author}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <header className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[15px] leading-5">
              {authorProfilePath ? (
                <Link
                  to={authorProfilePath}
                  className="max-w-[55%] truncate font-extrabold text-slate-950 hover:underline"
                >
                  {author.nome || "Viajante Vambora"}
                </Link>
              ) : (
                <span className="max-w-[55%] truncate font-extrabold text-slate-950">
                  {author.nome || "Viajante Vambora"}
                </span>
              )}
              {author.username ? (
                <Link
                  to={authorProfilePath}
                  className="truncate text-sm text-slate-500 hover:underline"
                >
                  @{author.username}
                </Link>
              ) : null}
              <span aria-hidden="true" className="text-slate-400">
                ·
              </span>
              <time className="text-sm text-slate-500" dateTime={post.criadoEm}>
                {formatCommunityDate(post.criadoEm)}
              </time>
              {canFollow ? (
                <button
                  type="button"
                  onClick={onToggleFollow}
                  disabled={followBusy}
                  aria-label={`${isFollowing ? "Deixar de seguir" : "Seguir"} ${author.nome || "viajante"}`}
                  className={`ml-1 rounded-full px-2.5 py-1 text-xs font-bold transition disabled:opacity-50 ${isFollowing ? "text-slate-500 hover:bg-red-50 hover:text-red-600" : "text-blue-700 hover:bg-blue-50"}`}
                >
                  {followBusy ? "…" : isFollowing ? "Seguindo" : "Seguir"}
                </button>
              ) : null}
            </header>
            <div className="relative shrink-0">
              <button
                ref={deleteMenuButtonRef}
                type="button"
                aria-label="Opções da publicação"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="grid h-9 w-9 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-100"
              >
                ⋯
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-10 z-30 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {isOwnPost ? (
                    <button
                      type="button"
                      disabled={deleteBusy}
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteConfirmOpen(true);
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleteBusy ? "Excluindo…" : "Excluir publicação"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReportOpen(true)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Denunciar publicação
                    </button>
                  )}
                  {isAdmin && !isOwnPost ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onAdminDeletePost?.();
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Remover pela moderação
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-6 text-slate-800">
            {post.texto}
          </p>

          {post.categorias?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.categorias.map(({ categoria }) => (
                <span
                  key={categoria.id}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                >
                  {categoria.nome}
                </span>
              ))}
            </div>
          ) : null}

          {post.fotos?.length ? (
            <div
              className={`mt-3 grid gap-1.5 overflow-hidden rounded-2xl ${post.fotos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
            >
              {post.fotos.map((photo) => (
                <img
                  key={photo.id}
                  src={apiAssetUrl(photo.url)}
                  alt="Foto da publicação"
                  loading="lazy"
                  className={`w-full bg-slate-100 object-cover ${post.fotos.length === 1 ? "max-h-[480px] rounded-2xl" : "h-48 sm:h-60"}`}
                />
              ))}
            </div>
          ) : null}

          {post.roteiro?.publico ? (
            <Link
              to={`/roteiros/${post.roteiro.id}`}
              className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-300"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-lg">
                🧭
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  Roteiro compartilhado
                </span>
                <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                  {post.roteiro.titulo}
                </span>
              </span>
              <span aria-hidden="true" className="text-blue-600">
                ↗
              </span>
            </Link>
          ) : null}

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={onToggleComments}
              aria-expanded={commentsOpen}
              aria-label={`${commentCount} comentários`}
              className="group flex items-center gap-2 rounded-full py-2 pr-3 text-slate-500 transition hover:text-blue-600"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-lg group-hover:bg-blue-50"
                aria-hidden="true"
              >
                ◯
              </span>
              <span className="text-xs">{commentCount}</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleLike}
                disabled={likeBusy}
                aria-pressed={Boolean(post.curtiu)}
                aria-label={
                  post.curtiu ? "Remover curtida" : "Curtir publicação"
                }
                className={`group grid h-9 w-9 place-items-center rounded-full text-xl transition ${post.curtiu ? "font-bold text-rose-600" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"}`}
              >
                <span aria-hidden="true">{post.curtiu ? "♥" : "♡"}</span>
              </button>
              <button
                type="button"
                onClick={showLikes}
                aria-label={`Ver ${likeCount} pessoas que curtiram`}
                className="rounded-full px-2 py-2 text-xs text-slate-500 hover:text-rose-600 hover:underline"
              >
                {likeBusy ? "…" : likeCount}
              </button>
            </div>
            <button
              type="button"
              onClick={onToggleSave}
              disabled={saveBusy}
              aria-pressed={Boolean(post.salvo)}
              aria-label={
                post.salvo ? "Remover dos salvos" : "Salvar publicação"
              }
              className={`group flex items-center gap-2 rounded-full py-2 pr-3 transition ${post.salvo ? "text-blue-700" : "text-slate-500 hover:text-blue-600"}`}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-lg group-hover:bg-blue-50"
                aria-hidden="true"
              >
                {post.salvo ? "▣" : "▱"}
              </span>
              <span className="text-xs">{saveBusy ? "…" : "Salvar"}</span>
            </button>
          </div>

          {!commentsOpen && post.comentarios?.length ? (
            <div className="mt-1 space-y-2">
              {post.comentarios.slice(0, 2).map((comment) => (
                <p
                  key={comment.id}
                  className="line-clamp-2 text-sm text-slate-600"
                >
                  <span className="mr-1 font-bold text-slate-800">
                    {comment.usuario?.nome || "Viajante"}
                  </span>
                  {comment.texto}
                </p>
              ))}
              {commentCount > 0 ? (
                <button
                  type="button"
                  onClick={onToggleComments}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-700"
                >
                  Ver todos os {commentCount} comentários
                </button>
              ) : null}
            </div>
          ) : null}

          {commentsOpen ? (
            <section
              aria-label="Comentários"
              className="mt-3 border-t border-slate-200 pt-4"
            >
              <h3 className="sr-only">Comentários</h3>
              {commentsLoading ? (
                <p className="py-3 text-sm text-slate-500">
                  Carregando comentários…
                </p>
              ) : null}
              {commentsError ? (
                <p
                  role="alert"
                  className="my-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {commentsError}
                </p>
              ) : null}
              {!commentsLoading && !commentsError && comments.length === 0 ? (
                <p className="py-3 text-sm text-slate-500">
                  Ainda não há comentários. Comece a conversa.
                </p>
              ) : null}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`flex gap-2.5 ${comment.comentarioPaiId ? "ml-8 border-l-2 border-blue-100 pl-3" : ""}`}
                  >
                    <Link
                      to={profilePath(comment.usuario) || "/comunidade"}
                      onClick={(event) => {
                        if (!profilePath(comment.usuario))
                          event.preventDefault();
                      }}
                      aria-label={
                        profilePath(comment.usuario)
                          ? `Ver perfil de ${comment.usuario?.nome}`
                          : undefined
                      }
                      className="shrink-0"
                    >
                      <UserAvatar
                        user={comment.usuario}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-xs font-bold text-slate-800">
                          {comment.usuario?.nome || "Viajante"}
                        </p>
                        <time className="text-[10px] text-slate-400">
                          {formatCommunityDate(comment.criadoEm)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-600">
                        {comment.texto}
                      </p>
                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTo(comment);
                            setCommentText(
                              `@${comment.usuario?.username || comment.usuario?.nome || "viajante"} `,
                            );
                            document
                              .getElementById(`comment-${post.id}`)
                              ?.focus();
                          }}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Responder
                        </button>
                      ) : null}
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Remover este comentário pela moderação?",
                              )
                            )
                              onAdminDeleteComment?.(comment.id);
                          }}
                          className="ml-3 mt-2 text-xs font-semibold text-red-600 hover:underline"
                        >
                          Excluir pela moderação
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              {isAuthenticated ? (
                <form
                  onSubmit={submitComment}
                  className="mt-4 flex items-center gap-2"
                >
                  <label htmlFor={`comment-${post.id}`} className="sr-only">
                    {replyTo
                      ? `Responder a ${replyTo.usuario?.nome || "comentário"}`
                      : "Escreva um comentário"}
                  </label>
                  <input
                    id={`comment-${post.id}`}
                    className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    maxLength={1000}
                    placeholder={
                      replyTo
                        ? `Respondendo a ${replyTo.usuario?.nome || "comentário"}`
                        : "Escreva um comentário"
                    }
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sendingComment || !commentText.trim()}
                    className="rounded-full bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {sendingComment
                      ? "…"
                      : replyTo
                        ? "Enviar resposta"
                        : "Comentar"}
                  </button>
                  {replyTo ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setCommentText("");
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancelar resposta
                    </button>
                  ) : null}
                </form>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  <Link
                    to="/login"
                    state={{ from: "/comunidade" }}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Entre na sua conta
                  </Link>{" "}
                  para participar da conversa.
                </p>
              )}
            </section>
          ) : null}
        </div>
      </div>
      {likesOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`likes-title-${post.id}`}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id={`likes-title-${post.id}`}
                className="text-lg font-extrabold"
              >
                Curtiram esta publicação
              </h2>
              <button
                type="button"
                onClick={() => setLikesOpen(false)}
                aria-label="Fechar"
                className="grid h-9 w-9 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            {likesLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Carregando viajantes…
              </p>
            ) : null}
            {likesError ? (
              <div className="py-6 text-center">
                <p role="alert" className="text-sm text-red-700">
                  {likesError}
                </p>
                <button
                  type="button"
                  onClick={showLikes}
                  className="mt-3 text-sm font-bold text-blue-700"
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}
            {!likesLoading && !likesError && !likedBy.length ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Ainda não há curtidas.
              </p>
            ) : null}
            <div className="mt-3 divide-y divide-slate-100">
              {likedBy.map(({ usuario }) => (
                <Link
                  key={usuario.id}
                  to={profilePath(usuario) || "/comunidade"}
                  onClick={(event) => {
                    if (!profilePath(usuario)) event.preventDefault();
                    setLikesOpen(false);
                  }}
                  className="flex items-center gap-3 py-3"
                >
                  <UserAvatar
                    user={usuario}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {usuario.nome}
                    </span>
                    {usuario.username ? (
                      <span className="block truncate text-xs text-slate-500">
                        @{usuario.username}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={submitReport}
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
          >
            <h2 className="text-lg font-extrabold">Denunciar publicação</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sua denúncia será analisada pela equipe. A publicação não será
              removida automaticamente.
            </p>
            <label
              className="mt-4 block text-sm font-semibold text-slate-700"
              htmlFor={`report-reason-${post.id}`}
            >
              Motivo <span className="text-red-600">*</span>
            </label>
            <select
              id={`report-reason-${post.id}`}
              required
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Selecione um motivo</option>
              {[
                "Spam",
                "Assédio ou discurso de ódio",
                "Conteúdo impróprio",
                "Informação enganosa",
                "Outro",
              ].map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <label
              className="mt-4 block text-sm font-semibold text-slate-700"
              htmlFor={`report-detail-${post.id}`}
            >
              Detalhes (opcional)
            </label>
            <textarea
              id={`report-detail-${post.id}`}
              maxLength={2000}
              rows={3}
              value={reportDetail}
              onChange={(event) => setReportDetail(event.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Conte um pouco mais para ajudar na análise"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                disabled={sendingReport}
                className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sendingReport || !reportReason}
                className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sendingReport ? "Enviando…" : "Enviar denúncia"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {deleteConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirmingDelete)
              setDeleteConfirmOpen(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${post.id}`}
            aria-describedby={`delete-description-${post.id}`}
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
          >
            <h2
              id={`delete-title-${post.id}`}
              className="text-lg font-extrabold"
            >
              Excluir publicação?
            </h2>
            <p
              id={`delete-description-${post.id}`}
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              Esta ação é permanente. A publicação e seus comentários serão
              removidos; o roteiro associado não será excluído.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={deleteCancelRef}
                type="button"
                disabled={confirmingDelete || deleteBusy}
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  deleteMenuButtonRef.current?.focus();
                }}
                className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmingDelete || deleteBusy}
                onClick={confirmDelete}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmingDelete || deleteBusy ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
