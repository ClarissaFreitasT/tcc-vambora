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

function countLabel(value, singular, plural) {
  return Number(value) === 1 ? singular : plural;
}

function formatDate(value) {
  if (!value) return "agora";
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

function ProfileStat({ value, singular, plural, onClick }) {
  const label = countLabel(value, singular, plural);
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

function ProfileTabIcon({ name }) {
  const paths = {
    posts: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
      </>
    ),
    routes: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    saved: (
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" />
    ),
    likes: (
      <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[name === "roteiros" ? "routes" : name]}
    </svg>
  );
}

function ProfileRouteCard({ roteiro }) {
  return (
    <Link
      key={roteiro.id}
      to={`/roteiros/${roteiro.id}`}
      className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md sm:rounded-2xl sm:p-5"
    >
      {roteiro.imagemUrl ? (
        <img
          src={roteiro.imagemUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
        Roteiro
      </span>
      <div className="relative text-white">
        <p className="truncate text-xs font-semibold text-white/80">
          {roteiro.destino}
        </p>
        <h2 className="mt-1 line-clamp-2 text-base font-extrabold leading-5 sm:text-lg">
          {roteiro.titulo}
        </h2>
      </div>
    </Link>
  );
}

function ProfilePublicationCard({ post, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="group relative flex aspect-square min-w-0 flex-col justify-between overflow-hidden rounded-md border border-slate-200/80 bg-white p-3 text-left transition hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5965F2] sm:rounded-lg sm:p-5"
      aria-label={`Abrir publicação: ${post.texto}`}
    >
      <div className="flex w-full items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
        <span className="truncate">
          {post.roteiro?.publico && post.roteiro?.titulo
            ? "Roteiro compartilhado"
            : "Publicação"}
        </span>
        <span
          className="shrink-0 text-slate-500"
          aria-label={`${post._count?.curtidas || 0} curtidas`}
        >
          ♥ {post._count?.curtidas || 0}
        </span>
      </div>
      <p className="line-clamp-5 w-full whitespace-pre-wrap text-left text-sm font-semibold leading-5 text-[#171936] sm:text-base sm:leading-6">
        {post.texto}
      </p>
      <time className="text-left text-[10px] text-slate-500">
        {formatDate(post.criadoEm)}
      </time>
    </button>
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
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [likedRoutes, setLikedRoutes] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState(null);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState(null);
  const [publicationModal, setPublicationModal] = useState(null);
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
    setActiveTab("posts");
    setSavedRoutes([]);
    setSavedPosts([]);
    setSavedError(null);
    setSavedLoading(isOwnProfile);
    setLikedPosts([]);
    setLikedRoutes([]);
    setLikesError(null);
    setLikesLoading(isOwnProfile);
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

      const [
        loadedPosts,
        loadedRoteiros,
        followers,
        followingUsers,
        saved,
        likes,
      ] = await Promise.all([
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
        isOwnProfile
          ? Promise.all([
              apiFetch("/roteiros/salvos"),
              apiFetch("/publicacoes/salvas"),
            ])
              .then(([routeEntries, savedPublications]) => ({
                routes: routeEntries
                  .map((entry) => entry.roteiro)
                  .filter(Boolean),
                posts: savedPublications,
              }))
              .catch((error) => {
                setSavedError(error.message);
                return { routes: [], posts: [] };
              })
          : Promise.resolve({ routes: [], posts: [] }),
        isOwnProfile
          ? apiFetch("/usuarios/me/curtidas").catch((error) => {
              setLikesError(error.message);
              return { publicacoes: [], roteiros: [] };
            })
          : Promise.resolve({ publicacoes: [], roteiros: [] }),
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
      setRoteiros(loadedRoteiros.filter((roteiro) => roteiro.publico === true));
      setSavedRoutes(saved.routes);
      setSavedPosts(saved.posts);
      setLikedPosts(likes.publicacoes || []);
      setLikedRoutes(likes.roteiros || []);
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
      setSavedLoading(false);
      setLikesLoading(false);
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
    () =>
      activeTab === "posts"
        ? posts.map((item) => ({ type: "post", item }))
        : activeTab === "saved"
          ? [
              ...savedPosts.map((item) => ({ type: "post", item })),
              ...savedRoutes.map((item) => ({ type: "route", item })),
            ]
          : activeTab === "likes"
            ? [
                ...likedPosts.map((item) => ({ type: "post", item })),
                ...likedRoutes.map((item) => ({ type: "route", item })),
              ]
            : roteiros.map((item) => ({ type: "route", item })),
    [
      activeTab,
      posts,
      roteiros,
      savedRoutes,
      savedPosts,
      likedPosts,
      likedRoutes,
    ],
  );

  async function openPublication(post) {
    setPublicationModal({ loading: true, data: null, error: null });
    try {
      const data = await apiFetch(`/publicacoes/${post.id}`);
      setPublicationModal({ loading: false, data, error: null });
    } catch (error) {
      setPublicationModal({ loading: false, data: null, error: error.message });
    }
  }

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
    const url = `${window.location.origin}${import.meta.env.BASE_URL}perfil/${encodeURIComponent(profile.username)}`;
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
        <div className="mx-auto max-w-5xl animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-slate-200 sm:h-24 sm:w-24" />
            <div className="space-y-3">
              <div className="h-6 w-48 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-100" />
            </div>
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
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-6 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <section className="pb-7 sm:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            <UserAvatar
              user={profile}
              alt={`Foto de ${profile.nome}`}
              className="h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-white sm:h-32 sm:w-32"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4">
                <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-black tracking-tight text-[#171936] sm:text-3xl">
                      {profile.nome}
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                      @{profile.username || "viajante"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <ProfileStat
                      value={roteiros.length}
                      singular="roteiro"
                      plural="roteiros"
                    />
                    <ProfileStat
                      value={profile.totalSeguidores ?? 0}
                      singular="seguidor"
                      plural="seguidores"
                      onClick={() => openRelationshipList("seguidores")}
                    />
                    <ProfileStat
                      value={profile.totalSeguindo ?? 0}
                      singular="seguido"
                      plural="seguidos"
                      onClick={() => openRelationshipList("seguindo")}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isOwnProfile ? (
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                    >
                      Editar perfil
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleFollow}
                      disabled={followBusy}
                      className={`rounded-full px-5 py-2 text-sm font-bold transition disabled:opacity-60 ${following ? "border border-slate-300 bg-white text-slate-800 hover:border-red-200 hover:text-red-600" : "bg-[#5965F2] text-white hover:bg-indigo-700"}`}
                    >
                      {followBusy
                        ? "Aguarde…"
                        : following
                          ? "Deixar de seguir"
                          : "Seguir"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={shareProfile}
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-lg text-slate-700 transition hover:bg-slate-50"
                    aria-label="Compartilhar perfil"
                    title="Compartilhar perfil"
                  >
                    ↗
                  </button>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {profile.bio ||
                  "Ainda não adicionou uma bio. Cada viagem é uma nova história."}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                {profile.personalidade ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true">✦</span>
                    {formatPersonality(profile.personalidade)}
                  </span>
                ) : null}
                <span>No Vambora desde {formatDate(profile.criadoEm)}</span>
              </div>
            </div>
          </div>
        </section>

        {status ? (
          <div className="mt-4">
            <Feedback status={status} onDismiss={() => setStatus(null)} />
          </div>
        ) : null}

        <section className="relative mt-1">
          <div
            role="tablist"
            aria-label="Conteúdo do perfil"
            className={`grid border-b border-slate-200/90 ${isOwnProfile ? "grid-cols-4" : "grid-cols-2"}`}
          >
            {[
              { id: "posts", label: "Publicações" },
              { id: "roteiros", label: "Roteiros" },
              ...(isOwnProfile
                ? [
                    { id: "saved", label: "Salvos" },
                    { id: "likes", label: "Curtidas" },
                  ]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-label={tab.label}
                aria-selected={activeTab === tab.id}
                title={tab.label}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex min-h-14 items-center justify-center text-[#5965F2] transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5965F2] ${activeTab === tab.id ? "" : "text-slate-400"}`}
              >
                <ProfileTabIcon name={tab.id} />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-[calc(100%+0.4rem)] z-10 hidden whitespace-nowrap rounded-md bg-[#171936] px-2 py-1 text-xs font-medium text-white shadow-md group-hover:block group-focus-visible:block"
                >
                  {tab.label}
                </span>
                {activeTab === tab.id ? (
                  <span className="absolute inset-x-1/4 bottom-0 h-0.5 rounded-full bg-[#5965F2]" />
                ) : null}
              </button>
            ))}
          </div>

          {activeTab === "saved" && savedError ? (
            <div
              className="m-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              Não foi possível carregar seus conteúdos salvos: {savedError}
              <button
                type="button"
                onClick={loadProfile}
                className="ml-2 font-bold underline decoration-current underline-offset-2"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {activeTab === "saved" && savedLoading ? (
            <p
              className="px-6 py-12 text-center text-sm text-slate-500"
              role="status"
            >
              Carregando seus conteúdos salvos…
            </p>
          ) : null}

          {activeTab === "likes" && likesError ? (
            <div
              className="m-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              Não foi possível carregar suas curtidas: {likesError}
            </div>
          ) : null}
          {activeTab === "likes" && likesLoading ? (
            <p
              className="px-6 py-12 text-center text-sm text-slate-500"
              role="status"
            >
              Carregando suas curtidas…
            </p>
          ) : null}

          {!(activeTab === "saved" && (savedLoading || savedError)) &&
            !(activeTab === "likes" && (likesLoading || likesError)) &&
            (activeContent.length ? (
              <div className="grid grid-cols-2 gap-1 p-1 sm:grid-cols-3 sm:gap-2 sm:p-2">
                {activeContent.map(({ type, item }) =>
                  type === "post" ? (
                    <ProfilePublicationCard
                      key={`post-${item.id}`}
                      post={item}
                      onOpen={openPublication}
                    />
                  ) : (
                    <ProfileRouteCard key={`route-${item.id}`} roteiro={item} />
                  ),
                )}
              </div>
            ) : (
              <div className="px-5 py-12 text-center sm:px-6 sm:py-14">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                  <ProfileTabIcon
                    name={
                      activeTab === "posts"
                        ? "posts"
                        : activeTab === "likes"
                          ? "likes"
                          : "routes"
                    }
                  />
                </span>
                <h2 className="mt-4 text-lg font-extrabold text-[#171936]">
                  {activeTab === "posts"
                    ? "Ainda sem publicações"
                    : activeTab === "saved"
                      ? "Nenhum conteúdo salvo por enquanto"
                      : activeTab === "likes"
                        ? "Você ainda não curtiu nenhum conteúdo"
                        : "Ainda sem roteiros públicos"}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {activeTab === "posts"
                    ? isOwnProfile
                      ? "Compartilhe uma dica de viagem para começar sua coleção de publicações."
                      : "Este viajante ainda não compartilhou publicações por aqui."
                    : activeTab === "saved"
                      ? "Salve publicações e roteiros interessantes para encontrá-los facilmente aqui."
                      : activeTab === "likes"
                        ? "Publicações e roteiros que você curtir aparecerão nesta coleção privada."
                        : isOwnProfile
                          ? "Crie e compartilhe seu primeiro roteiro para inspirar outros viajantes."
                          : "Este viajante ainda não compartilhou roteiros públicos."}
                </p>
                {isOwnProfile &&
                activeTab !== "saved" &&
                activeTab !== "likes" ? (
                  <Link
                    to={
                      activeTab === "posts" ? "/comunidade" : "/roteiros/novo"
                    }
                    className="mt-5 inline-flex rounded-full bg-[#5965F2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    {activeTab === "posts"
                      ? "Criar publicação"
                      : "Criar roteiro"}
                  </Link>
                ) : null}
                {activeTab === "saved" ? (
                  <Link
                    to="/roteiros/publicos"
                    className="mt-5 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Explorar roteiros
                  </Link>
                ) : null}
              </div>
            ))}
        </section>
      </div>

      {publicationModal ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPublicationModal(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-publication-title"
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2
                id="profile-publication-title"
                className="text-lg font-extrabold text-[#171936]"
              >
                Publicação
              </h2>
              <button
                type="button"
                onClick={() => setPublicationModal(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
                aria-label="Fechar publicação"
              >
                ×
              </button>
            </header>
            <div className="p-5 sm:p-7">
              {publicationModal.loading ? (
                <p
                  className="py-8 text-center text-sm text-slate-500"
                  role="status"
                >
                  Carregando publicação…
                </p>
              ) : null}
              {publicationModal.error ? (
                <p
                  className="rounded-2xl bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  Não foi possível carregar esta publicação:{" "}
                  {publicationModal.error}
                </p>
              ) : null}
              {publicationModal.data ? (
                <>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={publicationModal.data.usuario || profile}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {publicationModal.data.usuario?.nome || profile.nome}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(publicationModal.data.criadoEm)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {publicationModal.data.texto}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>
                      ♥ {publicationModal.data._count?.curtidas || 0} curtidas
                    </span>
                    <span>
                      {publicationModal.data._count?.comentarios || 0}{" "}
                      comentários
                    </span>
                  </div>
                  {publicationModal.data.roteiro?.publico ? (
                    <Link
                      to={`/roteiros/${publicationModal.data.roteiro.id}`}
                      onClick={() => setPublicationModal(null)}
                      className="mt-5 inline-flex rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      Ver roteiro: {publicationModal.data.roteiro.titulo}
                    </Link>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

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
                    : "Seguidos"}
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
