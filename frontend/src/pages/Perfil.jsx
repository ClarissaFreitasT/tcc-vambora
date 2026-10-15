import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Feedback from "../components/Feedback";
import UserAvatar from "../components/UserAvatar";
import { apiFetch } from "../data/api";
import { useAuth } from "../context/useAuth";
import {
  buildProfileUpdatePayload,
  profilePath,
  validateProfilePhotoUrl,
} from "../utils/profile";

function compactCount(value = 0) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

function formatDate(value) {
  if (!value) return "No Vambora desde agora";
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatPersonality(value) {
  if (!value) return "";
  const normalized = value.toLocaleLowerCase("pt-BR");
  return normalized.charAt(0).toLocaleUpperCase("pt-BR") + normalized.slice(1);
}

function ProfileStat({ value, label, onClick }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex items-baseline gap-1.5 text-sm text-slate-600 hover:text-blue-700"
      >
        <span className="font-extrabold text-slate-950 group-hover:text-blue-700">
          {compactCount(value)}
        </span>
        <span className="group-hover:underline">{label}</span>
      </button>
    );
  }

  return (
    <div className="flex items-baseline gap-1.5 text-sm text-slate-600">
      <span className="font-extrabold text-slate-950">
        {compactCount(value)}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function Perfil() {
  const { username: routeUsername, userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [roteiros, setRoteiros] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [relationshipList, setRelationshipList] = useState(null);
  const [status, setStatus] = useState(null);
  const [photoPreviewFailed, setPhotoPreviewFailed] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    username: "",
    bio: "",
    fotoUrl: "",
  });

  const isOwnProfile =
    (!routeUsername && !userId) ||
    routeUsername === user?.username ||
    userId === user?.id;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      if (userId && !isAuthenticated) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      const loadedProfile = isOwnProfile
        ? await apiFetch("/usuarios/me")
        : routeUsername
          ? await apiFetch(
              `/usuarios/perfil/${encodeURIComponent(routeUsername)}`,
            )
          : await apiFetch(`/usuarios/${encodeURIComponent(userId)}`);

      const [loadedPosts, loadedRoteiros, followers, followingUsers] =
        await Promise.all([
          apiFetch(`/publicacoes/usuario/${loadedProfile.id}`),
          isOwnProfile
            ? apiFetch("/roteiros")
            : routeUsername
              ? Promise.resolve(loadedProfile.roteiros || [])
              : apiFetch("/roteiros/publicos").then((items) =>
                  items.filter((item) => item.usuarioId === loadedProfile.id),
                ),
          userId && !isOwnProfile
            ? apiFetch(`/usuarios/${loadedProfile.id}/seguidores`)
            : Promise.resolve(null),
          userId && !isOwnProfile
            ? apiFetch(`/usuarios/${loadedProfile.id}/seguindo`)
            : Promise.resolve(null),
        ]);

      const profileWithStats =
        userId && !isOwnProfile
          ? {
              ...loadedProfile,
              totalSeguidores: followers.length,
              totalSeguindo: followingUsers.length,
              totalPublicacoes: loadedPosts.length,
            }
          : loadedProfile;

      setProfile(profileWithStats);
      setPosts(loadedPosts);
      setRoteiros(loadedRoteiros);
      setFollowing(Boolean(profileWithStats.seguindo));
      setForm({
        nome: profileWithStats.nome || "",
        username: profileWithStats.username || "",
        bio: profileWithStats.bio || "",
        fotoUrl: profileWithStats.fotoUrl || "",
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    isOwnProfile,
    location.pathname,
    navigate,
    routeUsername,
    userId,
  ]);

  useEffect(() => {
    queueMicrotask(() => loadProfile());
  }, [loadProfile]);

  const activeContent = useMemo(
    () => (activeTab === "posts" ? posts : roteiros),
    [activeTab, posts, roteiros],
  );

  async function saveProfile(event) {
    event.preventDefault();
    if (!form.nome.trim()) {
      setStatus({ type: "error", message: "Informe seu nome para continuar." });
      return;
    }
    const photoError = validateProfilePhotoUrl(form.fotoUrl);
    if (photoError) {
      setStatus({ type: "error", message: photoError });
      return;
    }

    const changes = buildProfileUpdatePayload(form);

    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateUser(changes);
      setProfile((current) => ({ ...current, ...updated }));
      setForm((current) => ({
        ...current,
        username: updated.username || current.username,
      }));
      setEditOpen(false);
      setStatus({ type: "success", message: "Perfil atualizado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function toggleFollow() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/perfil/${routeUsername}` } });
      return;
    }
    if (followBusy || !profile) return;

    setFollowBusy(true);
    try {
      await apiFetch(`/usuarios/${profile.id}/seguir`, {
        method: following ? "DELETE" : "POST",
      });
      setFollowing((value) => !value);
      setProfile((current) => ({
        ...current,
        totalSeguidores: Math.max(
          0,
          (current.totalSeguidores || 0) + (following ? -1 : 1),
        ),
      }));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setFollowBusy(false);
    }
  }

  async function openRelationshipList(type) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    setRelationshipList({ type, items: [], loading: true, error: null });
    try {
      const items = await apiFetch(`/usuarios/${profile.id}/${type}`);
      setRelationshipList({ type, items, loading: false, error: null });
    } catch (error) {
      setRelationshipList({
        type,
        items: [],
        loading: false,
        error: error.message,
      });
    }
  }

  async function shareProfile() {
    if (!profile.username) {
      setStatus({
        type: "error",
        message: "Adicione um nome de usuário para compartilhar seu perfil.",
      });
      return;
    }
    const url = `${window.location.origin}/perfil/${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ type: "success", message: "Link do perfil copiado." });
    } catch {
      setStatus({ type: "error", message: "Não foi possível copiar o link." });
    }
  }

  async function deleteAccount() {
    if (deleteConfirmation !== "EXCLUIR") return;
    setDeletingAccount(true);
    setStatus(null);
    try {
      await apiFetch(`/usuarios/${user.id}`, { method: "DELETE" });
      logout();
      navigate("/login", {
        replace: true,
        state: { message: "Sua conta e os dados associados foram excluídos." },
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      setDeletingAccount(false);
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto min-h-[70vh] px-4 py-16">
        <div className="mx-auto max-w-4xl animate-pulse overflow-hidden rounded-[32px] border border-slate-200 bg-white">
          <div className="h-48 bg-slate-200" />
          <div className="space-y-4 p-8">
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="h-4 w-72 rounded bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container mx-auto min-h-[70vh] max-w-3xl px-4 py-16">
        <Feedback status={status} />
        <Link to="/comunidade" className="btn-secondary mt-6">
          Voltar à comunidade
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="relative h-36 overflow-hidden bg-[linear-gradient(120deg,#101B3D_0%,#2563EB_55%,#67E8F9_100%)] sm:h-52">
            <div className="absolute -right-8 -top-28 h-72 w-72 rounded-full border-[36px] border-white/10" />
            <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-200/20 blur-2xl" />
            <span className="absolute bottom-5 left-6 rounded-full border border-white/20 bg-slate-950/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/85 backdrop-blur sm:left-10">
              Vambora · perfil de viajante
            </span>
          </div>

          <section className="relative px-5 pb-7 sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <UserAvatar
                user={profile}
                alt={`Foto de ${profile.nome}`}
                className="-mt-14 h-28 w-28 rounded-full border-4 border-white bg-white object-cover shadow-md sm:-mt-[74px] sm:h-36 sm:w-36"
              />
              <div className="flex flex-wrap gap-2 sm:pb-2">
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    Editar perfil
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleFollow}
                    disabled={followBusy}
                    className={`rounded-full px-6 py-2.5 text-sm font-bold transition disabled:opacity-60 ${following ? "border border-slate-300 bg-white text-slate-800 hover:border-red-200 hover:text-red-600" : "bg-slate-950 text-white hover:bg-slate-800"}`}
                  >
                    {followBusy
                      ? "Aguarde…"
                      : following
                        ? "Seguindo"
                        : "Seguir"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={shareProfile}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-lg text-slate-700 transition hover:bg-slate-50"
                  aria-label="Compartilhar perfil"
                >
                  ↗
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {profile.nome}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                @{profile.username || "viajante"}
              </p>
              <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {profile.bio ||
                  "Ainda não adicionou uma bio. Cada viagem é uma nova história."}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                {profile.personalidade ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true">✦</span>
                    {formatPersonality(profile.personalidade)}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true">◷</span>No Vambora desde{" "}
                  {formatDate(profile.criadoEm)}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
                <ProfileStat
                  value={profile.totalPublicacoes ?? posts.length}
                  label="publicações"
                />
                <ProfileStat
                  value={profile.totalSeguidores ?? 0}
                  label="seguidores"
                  onClick={() => openRelationshipList("seguidores")}
                />
                <ProfileStat
                  value={profile.totalSeguindo ?? 0}
                  label="seguindo"
                  onClick={() => openRelationshipList("seguindo")}
                />
                <ProfileStat value={roteiros.length} label="roteiros" />
              </div>
              {isOwnProfile ? (
                <Link
                  to="/roteiros/salvos"
                  className="mt-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  🔖 Abrir minha biblioteca de roteiros salvos
                </Link>
              ) : null}
            </div>
          </section>
        </div>

        {status ? (
          <div className="mt-4">
            <Feedback status={status} onDismiss={() => setStatus(null)} />
          </div>
        ) : null}

        <section className="mt-7 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
          <div
            role="tablist"
            aria-label="Conteúdo do perfil"
            className="grid grid-cols-2 border-b border-slate-200"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
              className={`relative flex items-center justify-center gap-2 px-4 py-4 text-sm transition hover:bg-slate-50 ${activeTab === "posts" ? "font-extrabold text-slate-950" : "font-semibold text-slate-500"}`}
            >
              <span aria-hidden="true">▦</span>Publicações
              {activeTab === "posts" ? (
                <span className="absolute inset-x-10 bottom-0 h-0.5 rounded bg-blue-600" />
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "roteiros"}
              onClick={() => setActiveTab("roteiros")}
              className={`relative flex items-center justify-center gap-2 px-4 py-4 text-sm transition hover:bg-slate-50 ${activeTab === "roteiros" ? "font-extrabold text-slate-950" : "font-semibold text-slate-500"}`}
            >
              <span aria-hidden="true">⌖</span>Roteiros
              {activeTab === "roteiros" ? (
                <span className="absolute inset-x-10 bottom-0 h-0.5 rounded bg-blue-600" />
              ) : null}
            </button>
          </div>

          {activeContent.length ? (
            activeTab === "posts" ? (
              <div className="grid grid-cols-2 gap-1 p-1 sm:grid-cols-3 sm:gap-2 sm:p-2">
                {posts.map((post, index) => (
                  <article
                    key={post.id}
                    className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl p-4 text-white sm:rounded-2xl sm:p-5 ${["bg-gradient-to-br from-blue-700 to-cyan-500", "bg-gradient-to-br from-indigo-800 to-blue-500", "bg-gradient-to-br from-slate-800 to-sky-600"][index % 3]}`}
                  >
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 group-hover:bg-slate-950/10" />
                    <div className="relative flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
                      <span>
                        {post.roteiro?.publico && post.roteiro?.titulo
                          ? "Roteiro"
                          : "Diário de viagem"}
                      </span>
                      <span
                        aria-label={`${post._count?.curtidas || 0} curtidas`}
                      >
                        ♥ {post._count?.curtidas || 0}
                      </span>
                    </div>
                    <p className="relative line-clamp-5 whitespace-pre-wrap text-sm font-semibold leading-6 sm:text-base">
                      {post.texto}
                    </p>
                    <time className="relative text-[10px] text-white/70">
                      {formatDate(post.criadoEm)}
                    </time>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                {roteiros.map((roteiro) => (
                  <Link
                    key={roteiro.id}
                    to={`/roteiros/${roteiro.id}`}
                    className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        {roteiro.publico === false
                          ? "Privado"
                          : "Compartilhado"}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-blue-600 transition group-hover:translate-x-1"
                      >
                        ↗
                      </span>
                    </div>
                    <h2 className="mt-4 text-lg font-black text-slate-950 group-hover:text-blue-700">
                      {roteiro.titulo}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {roteiro.destino}
                    </p>
                    {roteiro.descricao ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {roteiro.descricao}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-2xl text-blue-600">
                {activeTab === "posts" ? "✦" : "⌖"}
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                {activeTab === "posts"
                  ? "Ainda sem publicações"
                  : "Ainda sem roteiros"}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {isOwnProfile
                  ? "Compartilhe uma dica de viagem ou publique um roteiro para preencher seu perfil."
                  : "Este viajante ainda não compartilhou conteúdo por aqui."}
              </p>
              {isOwnProfile ? (
                <Link
                  to={activeTab === "posts" ? "/comunidade" : "/roteiros/novo"}
                  className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  {activeTab === "posts" ? "Criar publicação" : "Criar roteiro"}
                </Link>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {relationshipList ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setRelationshipList(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="relationship-list-title"
            className="flex max-h-[min(80vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2
                  id="relationship-list-title"
                  className="text-lg font-black text-slate-950"
                >
                  {relationshipList.type === "seguidores"
                    ? "Seguidores"
                    : "Pessoas que segue"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{profile.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setRelationshipList(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
                aria-label="Fechar lista"
              >
                ×
              </button>
            </header>

            <div className="overflow-y-auto p-2">
              {relationshipList.loading ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  Carregando lista…
                </p>
              ) : null}
              {relationshipList.error ? (
                <p
                  role="alert"
                  className="m-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {relationshipList.error}
                </p>
              ) : null}
              {!relationshipList.loading &&
              !relationshipList.error &&
              relationshipList.items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  {relationshipList.type === "seguidores"
                    ? "Este perfil ainda não tem seguidores."
                    : "Este perfil ainda não segue ninguém."}
                </p>
              ) : null}
              {!relationshipList.loading && !relationshipList.error
                ? relationshipList.items.map((relationship) => {
                    const person =
                      relationshipList.type === "seguidores"
                        ? relationship.seguidor
                        : relationship.seguido;
                    if (!person) return null;
                    const href = profilePath(person);

                    return (
                      <div
                        key={relationship.id}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50"
                      >
                        <Link
                          to={href}
                          onClick={() => setRelationshipList(null)}
                          aria-label={`Ver perfil de ${person.nome}`}
                          className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <UserAvatar
                            user={person}
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={href}
                            onClick={() => setRelationshipList(null)}
                            className="block truncate text-sm font-bold text-slate-900 hover:underline"
                          >
                            {person.nome}
                          </Link>
                          <p className="truncate text-xs text-slate-500">
                            {person.username ? (
                              <Link
                                to={href}
                                onClick={() => setRelationshipList(null)}
                                className="hover:underline"
                              >
                                @{person.username}
                              </Link>
                            ) : (
                              person.bio || "Viajante Vambora"
                            )}
                          </p>
                        </div>
                        <Link
                          to={href}
                          onClick={() => setRelationshipList(null)}
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-white"
                        >
                          Ver perfil
                        </Link>
                      </div>
                    );
                  })
                : null}
            </div>
          </section>
        </div>
      ) : null}

      {editOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="my-auto w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
                  Seu espaço
                </p>
                <h2
                  id="edit-profile-title"
                  className="mt-2 text-2xl font-black text-slate-950"
                >
                  Editar perfil
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <form onSubmit={saveProfile} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Nome
                <input
                  className="input-field rounded-2xl"
                  value={form.nome}
                  maxLength={255}
                  onChange={(event) =>
                    setForm({ ...form, nome: event.target.value })
                  }
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Nome de usuário
                <span className="relative">
                  <span className="absolute left-4 top-3 text-slate-400">
                    @
                  </span>
                  <input
                    className="input-field rounded-2xl pl-9"
                    value={form.username}
                    maxLength={80}
                    placeholder="seu.nome"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        username: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9._-]/g, ""),
                      })
                    }
                  />
                </span>
                <span className="text-xs font-normal text-slate-500">
                  Use letras, números, ponto, hífen ou sublinhado.
                </span>
              </label>
              <div className="grid gap-2 text-sm font-semibold text-slate-700">
                <label htmlFor="profile-photo-url">Foto do perfil</label>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {form.fotoUrl && !photoPreviewFailed ? (
                    <img
                      key={form.fotoUrl}
                      src={form.fotoUrl}
                      alt="Prévia da foto de perfil"
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                      onError={() => setPhotoPreviewFailed(true)}
                    />
                  ) : (
                    <UserAvatar
                      user={{ nome: form.nome, fotoUrl: null }}
                      alt="Prévia padrão do perfil"
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <p className="text-xs font-normal leading-5 text-slate-500">
                    A prévia mostra a imagem que será salva.
                  </p>
                </div>
                <input
                  id="profile-photo-url"
                  className="input-field rounded-2xl"
                  type="url"
                  value={form.fotoUrl}
                  maxLength={255}
                  placeholder="Link direto da imagem · https://…"
                  onChange={(event) => {
                    setForm({ ...form, fotoUrl: event.target.value });
                    setPhotoPreviewFailed(false);
                  }}
                />
                <span className="text-xs font-normal leading-5 text-slate-500">
                  Use o endereço direto de uma imagem pública (.jpg, .png ou
                  .webp), com até 255 caracteres. O campo não envia arquivos do
                  computador.
                </span>
                {photoPreviewFailed ? (
                  <span
                    role="status"
                    className="text-xs font-medium text-amber-700"
                  >
                    Não foi possível carregar esse link como imagem. Confira se
                    é um link direto e público.
                  </span>
                ) : null}
              </div>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Bio
                <textarea
                  className="input-field resize-y rounded-2xl"
                  rows={4}
                  maxLength={500}
                  value={form.bio}
                  placeholder="Conte um pouco sobre você e seu jeito de viajar…"
                  onChange={(event) =>
                    setForm({ ...form, bio: event.target.value })
                  }
                />
                <span className="text-right text-xs font-normal text-slate-400">
                  {form.bio.length}/500
                </span>
              </label>
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? "Salvando…" : "Salvar alterações"}
                </button>
              </div>
              <div className="mt-5 border-t border-red-100 pt-5">
                <h3 className="text-sm font-bold text-red-700">
                  Excluir conta
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  A exclusão é permanente e remove os dados associados à sua
                  conta.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setDeleteConfirmation("");
                    setDeleteAccountOpen(true);
                  }}
                  className="mt-3 rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Excluir minha conta
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {deleteAccountOpen ? (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Ação permanente
            </p>
            <h2
              id="delete-account-title"
              className="mt-2 text-2xl font-black text-slate-950"
            >
              Excluir sua conta?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Seus dados e conteúdos associados serão removidos. Esta ação não
              poderá ser desfeita.
            </p>
            <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
              Digite EXCLUIR para confirmar
              <input
                autoFocus
                className="input-field rounded-2xl"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            </label>
            {status?.type === "error" ? (
              <div className="mt-4">
                <Feedback status={status} onDismiss={() => setStatus(null)} />
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                disabled={deletingAccount}
                onClick={() => setDeleteAccountOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingAccount || deleteConfirmation !== "EXCLUIR"}
                onClick={deleteAccount}
                className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingAccount ? "Excluindo…" : "Excluir permanentemente"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
