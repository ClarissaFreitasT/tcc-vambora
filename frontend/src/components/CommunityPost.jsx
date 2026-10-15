import { useState } from "react";
import UserAvatar from "./UserAvatar";
import { Link } from "react-router-dom";
import { formatCommunityDate } from "../utils/community";
import { profilePath } from "../utils/profile";

export default function CommunityPost({
  post,
  isAuthenticated,
  isAdmin = false,
  comments,
  commentsOpen,
  commentsLoading,
  commentsError,
  likeBusy,
  onToggleLike,
  onToggleComments,
  onAddComment,
  onAdminDeletePost,
  onAdminDeleteComment,
}) {
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sendingComment, setSendingComment] = useState(false);
  const author = post.usuario || {};
  const authorProfilePath = profilePath(author);
  const likeCount = post._count?.curtidas || 0;
  const commentCount = post._count?.comentarios || 0;

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

  return (
    <article className="border-b border-slate-200 px-4 py-5 transition hover:bg-slate-50/60 sm:px-6">
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
            </header>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => onAdminDeletePost?.()}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-slate-400 hover:bg-red-50 hover:text-red-700"
                aria-label="Remover publicação pela moderação"
              >
                Moderar · excluir
              </button>
            ) : null}
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-6 text-slate-800">
            {post.texto}
          </p>

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

          <div className="mt-3 flex max-w-[460px] items-center justify-between">
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
            <button
              type="button"
              onClick={onToggleLike}
              disabled={likeBusy}
              aria-pressed={Boolean(post.curtiu)}
              aria-label={`${post.curtiu ? "Remover curtida" : "Curtir"} · ${likeCount} curtidas`}
              className={`group flex items-center gap-2 rounded-full py-2 pr-3 transition ${post.curtiu ? "text-rose-600" : "text-slate-500 hover:text-rose-600"}`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-xl group-hover:bg-rose-50 ${post.curtiu ? "font-bold" : ""}`}
                aria-hidden="true"
              >
                {post.curtiu ? "♥" : "♡"}
              </span>
              <span className="text-xs">{likeBusy ? "…" : likeCount}</span>
            </button>
            <span
              className="flex items-center gap-2 py-2 pr-3 text-slate-400"
              aria-label="Compartilhamento em breve"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-lg"
                aria-hidden="true"
              >
                ↗
              </span>
            </span>
          </div>

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
    </article>
  );
}
