import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Feedback from "../components/Feedback";
import UserAvatar from "../components/UserAvatar";
import ObjectUrlImage from "../components/ObjectUrlImage";
import { apiFetch } from "../data/api";
import { useAuth } from "../context/useAuth";
import {
  buildProfileUpdatePayload,
  profilePath,
  validateProfilePhotoUrl,
} from "../utils/profile";
import "./Perfil.css";

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

function profileInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1] : first.slice(1);
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
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
        className="profile-stat group flex items-baseline gap-1.5 text-sm text-slate-600 hover:text-blue-700"
      >
        <span className="profile-stat-number font-extrabold text-slate-950 group-hover:text-blue-700">
          {compactCount(value)}
        </span>
        <span className="profile-stat-label group-hover:underline">
          {label}
        </span>
      </button>
    );
  }

  return (
    <div className="profile-stat flex items-baseline gap-1.5 text-sm text-slate-600">
      <span className="profile-stat-number font-extrabold text-slate-950">
        {compactCount(value)}
      </span>
      <span className="profile-stat-label">{label}</span>
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

function ProfileRouteCard({
  roteiro,
  isAuthenticated,
  onRequireLogin,
  saved,
  onToggleSave,
}) {
  const totalDias = roteiro.totalDias ?? roteiro.dias?.length ?? 0;
  const [totalLikes, setTotalLikes] = useState(
    Number(roteiro.totalCurtidas || 0),
  );
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch(`/roteiros/${roteiro.id}/curtidas`)
      .then((result) => {
        if (!active) return;
        setTotalLikes(
          Number(result?.totalCurtidas ?? roteiro.totalCurtidas ?? 0),
        );
        setLiked(Boolean(result?.curtiu));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [roteiro.id, roteiro.totalCurtidas]);

  async function toggleLike(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      const result = await apiFetch(`/roteiros/${roteiro.id}/curtir`, {
        method: liked ? "DELETE" : "POST",
      });
      setLiked(!liked);
      setTotalLikes(Number(result?.totalCurtidas ?? totalLikes));
    } catch (error) {
      if (!liked && error.status === 409) {
        setLiked(true);
        setTotalLikes((current) => current + 1);
      }
    } finally {
      setLikeBusy(false);
    }
  }

  return (
    <article className="profile-route-card">
      <Link to={`/roteiros/${roteiro.id}`} className="profile-route-card-link">
        {roteiro.imagemUrl ? (
          <img
            src={roteiro.imagemUrl}
            alt={`Paisagem do roteiro para ${roteiro.destino}`}
            className="profile-route-image"
            loading="lazy"
          />
        ) : (
          <div className="profile-route-image profile-route-image-fallback" />
        )}
        <div className="profile-route-image-overlay" />
        <div className="profile-route-card-content">
          <p className="profile-route-destination">{roteiro.destino}</p>
          <h2>{roteiro.titulo}</h2>
          <p className="profile-route-author">
            Por {roteiro.usuario?.nome || "Viajante Vambora"}
          </p>
          <div className="profile-route-meta">
            <span>
              {Number(roteiro.totalAvaliacoes || 0) > 0
                ? `★ ${Number(roteiro.mediaAvaliacao || 0).toFixed(1)} (${roteiro.totalAvaliacoes})`
                : "Ainda sem avaliações"}
            </span>
            <span>
              {roteiro.orcamento !== null && roteiro.orcamento !== undefined
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(roteiro.orcamento))
                : "Orçamento não informado"}
            </span>
            <span>{`${totalDias} ${totalDias === 1 ? "dia" : "dias"}`}</span>
          </div>
        </div>
      </Link>
      <div
        className="profile-route-social-actions"
        aria-label="Interações do roteiro"
      >
        <button
          type="button"
          className={`profile-route-social-button${liked ? " is-active" : ""}`}
          onClick={toggleLike}
          disabled={likeBusy}
          aria-label={liked ? "Remover curtida do roteiro" : "Curtir roteiro"}
          aria-pressed={liked}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
          </svg>
          <span>{totalLikes}</span>
        </button>
        <button
          type="button"
          className={`profile-route-social-button${saved ? " is-active" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleSave(roteiro, saved);
          }}
          aria-label={saved ? "Remover roteiro dos salvos" : "Salvar roteiro"}
          aria-pressed={saved}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 3h12v18l-6-4.5L6 21Z" />
          </svg>
        </button>
      </div>
    </article>
  );
}

function ProfilePublicationCard({
  post,
  onOpen,
  isAuthenticated,
  onRequireLogin,
  saved,
  onToggleSave,
}) {
  const [likeCount, setLikeCount] = useState(
    Number(post._count?.curtidas || 0),
  );
  const [liked, setLiked] = useState(Boolean(post.curtiu));
  const [likeBusy, setLikeBusy] = useState(false);

  async function toggleLike() {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      await apiFetch(`/publicacoes/${post.id}/curtir`, {
        method: liked ? "DELETE" : "POST",
      });
      setLiked(!liked);
      setLikeCount((current) => current + (liked ? -1 : 1));
    } catch (error) {
      if (!liked && error.status === 409) {
        setLiked(true);
        setLikeCount((current) => current + 1);
      }
    } finally {
      setLikeBusy(false);
    }
  }

  return (
    <article className="profile-publication-card">
      <header className="profile-publication-header">
        <UserAvatar
          user={post.usuario}
          alt=""
          className="profile-publication-avatar"
        />
        <div className="min-w-0">
          <strong>{post.usuario?.nome || "Viajante Vambora"}</strong>
          <span>
            {formatDate(post.criadoEm)}
            <em>{post.categorias?.[0]?.categoria?.nome || "Publicação"}</em>
          </span>
        </div>
      </header>
      <p className="profile-publication-text">{post.texto}</p>
      {post.fotos?.length ? (
        <div className="profile-publication-photos">
          {post.fotos.map((photo, index) => (
            <img
              key={photo.id || photo.url}
              src={photo.url}
              alt={`Foto ${index + 1} da publicação`}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ))}
        </div>
      ) : null}
      {post.roteiro?.publico ? (
        <Link
          to={`/roteiros/${post.roteiro.id}`}
          className="profile-publication-route"
        >
          {post.roteiro.imagemUrl ? (
            <img
              className="profile-publication-route-thumb"
              src={post.roteiro.imagemUrl}
              alt=""
              loading="lazy"
            />
          ) : null}
          <span className="min-w-0">
            <strong>{post.roteiro.titulo}</strong>
            <small>{post.roteiro.destino}</small>
          </span>
          <span className="profile-publication-route-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      ) : null}
      <div className="profile-publication-actions">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy}
          aria-label={liked ? "Remover curtida" : "Curtir publicação"}
          aria-pressed={liked}
          className={liked ? "is-liked" : ""}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 20.5s-8-4.8-8-10.8A4.5 4.5 0 0 1 12 6.9a4.5 4.5 0 0 1 8 2.8c0 6-8 10.8-8 10.8Z" />
          </svg>
          {likeCount}
        </button>
        <span aria-label={`${post._count?.comentarios || 0} comentários`}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 5h16v11H9l-5 4Z" />
          </svg>
          {post._count?.comentarios || 0}
        </span>
        <button
          type="button"
          className="profile-publication-open"
          onClick={() => onOpen(post)}
          aria-label="Abrir publicação"
        >
          Abrir
        </button>
        <button
          type="button"
          className={`profile-publication-save${saved ? " is-saved" : ""}`}
          onClick={() => onToggleSave(post, saved)}
          aria-label={
            saved ? "Remover publicação dos salvos" : "Salvar publicação"
          }
          aria-pressed={saved}
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 3h12v18l-6-4.5L6 21Z" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default function Perfil() {
  const { username: routeUsername, userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser, syncUser, isAuthenticated, logout } = useAuth();
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
  const [contentFilter, setContentFilter] = useState("roteiros");
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
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoBusy, setProfilePhotoBusy] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    username: "",
    bio: "",
    fotoUrl: "",
  });
  const isOwnProfile =
    (!routeUsername && !userId) ||
    (Boolean(routeUsername) && routeUsername === user?.username) ||
    (Boolean(userId) && userId === user?.id);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    setActiveTab("posts");
    setSavedRoutes([]);
    setSavedPosts([]);
    setSavedError(null);
    setSavedLoading(isAuthenticated);
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
        isAuthenticated
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

  const savedRouteIds = new Set(savedRoutes.map((route) => route.id));
  const savedPostIds = new Set(savedPosts.map((post) => post.id));

  function requireLoginForSave() {
    navigate("/login", { state: { from: location.pathname } });
  }

  async function toggleProfileSave(item, saved) {
    if (!isAuthenticated) {
      requireLoginForSave();
      return;
    }

    const isRoute = Boolean(item.destino || item.totalDias || item.publico);
    const endpoint = isRoute
      ? `/roteiros/${item.id}/salvar`
      : `/publicacoes/${item.id}/salvar`;

    try {
      await apiFetch(endpoint, { method: saved ? "DELETE" : "POST" });
      if (isRoute) {
        setSavedRoutes((current) =>
          saved
            ? current.filter((entry) => entry.id !== item.id)
            : current.some((entry) => entry.id === item.id)
              ? current
              : [...current, item],
        );
      } else {
        setSavedPosts((current) =>
          saved
            ? current.filter((entry) => entry.id !== item.id)
            : current.some((entry) => entry.id === item.id)
              ? current
              : [...current, item],
        );
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  const activeContent = useMemo(() => {
    if (activeTab === "posts")
      return posts.map((item) => ({ type: "post", item }));
    if (activeTab === "roteiros")
      return roteiros.map((item) => ({ type: "route", item }));
    if (activeTab === "saved")
      return (contentFilter === "posts" ? savedPosts : savedRoutes).map(
        (item) => ({
          type: contentFilter === "posts" ? "post" : "route",
          item,
        }),
      );
    return (contentFilter === "posts" ? likedPosts : likedRoutes).map(
      (item) => ({
        type: contentFilter === "posts" ? "post" : "route",
        item,
      }),
    );
  }, [
    activeTab,
    contentFilter,
    posts,
    roteiros,
    savedRoutes,
    savedPosts,
    likedPosts,
    likedRoutes,
  ]);

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

  async function uploadProfilePhoto(file) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setStatus({
        type: "error",
        message: "Use uma foto JPG, PNG ou WebP de até 8 MB.",
      });
      return;
    }
    setProfilePhotoFile(file);
    setProfilePhotoBusy(true);
    setStatus(null);
    try {
      const body = new FormData();
      body.append("foto", file);
      const response = await apiFetch("/usuarios/me/foto", {
        method: "POST",
        body,
      });
      syncUser(response.usuario);
      setProfile((current) => ({ ...current, ...response.usuario }));
      setForm((current) => ({
        ...current,
        fotoUrl: response.usuario.fotoUrl || "",
      }));
      setProfilePhotoFile(null);
      setStatus({ type: "success", message: "Foto do perfil atualizada." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setProfilePhotoBusy(false);
    }
  }

  async function removeProfilePhoto() {
    setProfilePhotoBusy(true);
    setStatus(null);
    try {
      const response = await apiFetch("/usuarios/me/foto", {
        method: "DELETE",
      });
      syncUser(response.usuario);
      setProfile((current) => ({ ...current, ...response.usuario }));
      setForm((current) => ({ ...current, fotoUrl: "" }));
      setProfilePhotoFile(null);
      setStatus({ type: "success", message: "Foto do perfil removida." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setProfilePhotoBusy(false);
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
    <main className="profile-page px-4 py-6 sm:px-6 lg:py-8">
      <div className="profile-page-inner">
        <section className="profile-top">
          <div className="profile-photo-column">
            <div className="profile-photo-ring">
              <div className="profile-photo-frame">
                {profilePhotoFile ? (
                  <ObjectUrlImage
                    file={profilePhotoFile}
                    alt={`Prévia da foto de ${profile.nome}`}
                    className="profile-photo-image"
                  />
                ) : profile.fotoUrl ? (
                  <UserAvatar
                    user={profile}
                    alt={`Foto de ${profile.nome}`}
                    className="profile-photo-image"
                  />
                ) : (
                  <span className="profile-photo-initials" aria-hidden="true">
                    {profileInitials(profile.nome)}
                  </span>
                )}
                {isOwnProfile ? (
                  <label
                    className={`profile-photo-edit ${profilePhotoBusy ? "is-busy" : ""}`}
                    title="Alterar foto de perfil"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Alterar foto de perfil"
                      disabled={profilePhotoBusy}
                      onChange={(event) =>
                        uploadProfilePhoto(event.target.files?.[0])
                      }
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </div>

          <div className="profile-info min-w-0">
            <div className="profile-title-row">
              <div className="min-w-0">
                <h1 className="profile-name">{profile.nome}</h1>
                <p className="profile-username">
                  @{profile.username || "viajante"}
                </p>
              </div>
              <div className="profile-actions">
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="profile-button profile-button-secondary"
                  >
                    Editar perfil
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleFollow}
                    disabled={followBusy}
                    className={`profile-button ${following ? "profile-button-secondary" : ""}`}
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
                  className="profile-share-button"
                  aria-label="Compartilhar perfil"
                  title="Compartilhar perfil"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 16V4m0 0L7 9m5-5 5 5" />
                    <path d="M5 13v6h14v-6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="profile-stats">
              <ProfileStat
                value={roteiros.length}
                singular="roteiro"
                plural="roteiros"
              />
              <ProfileStat
                value={profile.totalPublicacoes ?? posts.length}
                singular="publicação"
                plural="publicações"
              />
              <ProfileStat
                value={profile.totalSeguidores ?? 0}
                singular="seguidor"
                plural="seguidores"
                onClick={() => openRelationshipList("seguidores")}
              />
              <ProfileStat
                value={profile.totalSeguindo ?? 0}
                singular="seguindo"
                plural="seguindo"
                onClick={() => openRelationshipList("seguindo")}
              />
            </div>

            <div className="profile-summary">
              <span className="profile-role">Viajante</span>
              <p className={`profile-bio ${profile.bio ? "" : "is-empty"}`}>
                {profile.bio ||
                  "Ainda não adicionou uma bio. Cada viagem é uma nova história."}
              </p>
              <div className="profile-meta">
                {profile.personalidade ? (
                  <span>
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
            className={`profile-tabs grid ${isOwnProfile ? "grid-cols-4" : "grid-cols-2"}`}
          >
            {[
              { id: "roteiros", label: "Roteiros" },
              { id: "posts", label: "Publicações" },
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
                onClick={() => {
                  setActiveTab(tab.id);
                  setContentFilter("roteiros");
                }}
                className={`profile-tab group relative flex min-h-14 items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${activeTab === tab.id ? "is-active" : ""}`}
              >
                <ProfileTabIcon name={tab.id} />
                <span className="profile-tab-label">{tab.label}</span>
                <span aria-hidden="true" className="sr-only">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {activeTab === "saved" || activeTab === "likes" ? (
            <div
              className="profile-content-filter"
              role="group"
              aria-label="Filtrar conteúdo"
            >
              <button
                type="button"
                aria-pressed={contentFilter === "roteiros"}
                onClick={() => setContentFilter("roteiros")}
              >
                Roteiros
              </button>
              <button
                type="button"
                aria-pressed={contentFilter === "posts"}
                onClick={() => setContentFilter("posts")}
              >
                Publicações
              </button>
            </div>
          ) : null}

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
              <div
                className={
                  activeTab === "posts" ||
                  ((activeTab === "saved" || activeTab === "likes") &&
                    contentFilter === "posts")
                    ? "profile-publication-list"
                    : "profile-route-list"
                }
              >
                {activeContent.map(({ type, item }) =>
                  type === "post" ? (
                    <ProfilePublicationCard
                      key={`post-${item.id}`}
                      post={item}
                      onOpen={openPublication}
                      isAuthenticated={isAuthenticated}
                      onRequireLogin={() =>
                        navigate("/login", {
                          state: { from: location.pathname },
                        })
                      }
                      saved={savedPostIds.has(item.id)}
                      onToggleSave={toggleProfileSave}
                    />
                  ) : (
                    <ProfileRouteCard
                      key={`route-${item.id}`}
                      roteiro={item}
                      isAuthenticated={isAuthenticated}
                      onRequireLogin={() =>
                        navigate("/login", {
                          state: { from: location.pathname },
                        })
                      }
                      saved={savedRouteIds.has(item.id)}
                      onToggleSave={toggleProfileSave}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="profile-empty px-5 py-12 text-center sm:px-6 sm:py-14">
                <span className="profile-empty-icon mx-auto grid h-12 w-12 place-items-center rounded-full">
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
                <h2 className="profile-empty-title mt-4 text-lg font-extrabold">
                  {activeTab === "posts"
                    ? "Ainda sem publicações"
                    : activeTab === "roteiros"
                      ? "Ainda sem roteiros públicos"
                      : activeTab === "saved"
                        ? contentFilter === "posts"
                          ? "Nenhuma publicação salva"
                          : "Nenhum roteiro salvo"
                        : activeTab === "likes"
                          ? contentFilter === "posts"
                            ? "Você ainda não curtiu publicações"
                            : "Você ainda não curtiu roteiros"
                          : "Ainda sem roteiros públicos"}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {activeTab === "posts"
                    ? isOwnProfile
                      ? "Compartilhe uma dica de viagem para começar sua coleção de publicações."
                      : "Este viajante ainda não compartilhou publicações por aqui."
                    : activeTab === "saved"
                      ? contentFilter === "posts"
                        ? "As publicações que você salvar ficam reunidas aqui."
                        : "Os roteiros que você salvar ficam reunidos aqui."
                      : activeTab === "likes"
                        ? contentFilter === "posts"
                          ? "As publicações que você curtir ficam reunidas aqui."
                          : "Os roteiros que você curtir ficam reunidos aqui."
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
                    to={
                      contentFilter === "posts"
                        ? "/comunidade"
                        : "/roteiros/publicos"
                    }
                    className="mt-5 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    {contentFilter === "posts"
                      ? "Explorar publicações"
                      : "Explorar roteiros"}
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
                  {publicationModal.data.fotos?.length ? (
                    <div
                      className={`mt-5 grid gap-1.5 overflow-hidden rounded-2xl ${publicationModal.data.fotos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                    >
                      {publicationModal.data.fotos.map((foto, index) => (
                        <img
                          key={foto.id || foto.url}
                          src={foto.url}
                          alt={`Foto ${index + 1} da publicação`}
                          className="aspect-[4/3] w-full bg-slate-100 object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
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
                <label htmlFor="profile-photo-file">Foto do perfil</label>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {profilePhotoFile ? (
                    <ObjectUrlImage
                      file={profilePhotoFile}
                      alt="Prévia da nova foto de perfil"
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : form.fotoUrl && !photoPreviewFailed ? (
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
                <div className="flex flex-wrap items-center gap-2">
                  <label className="btn-secondary cursor-pointer">
                    Escolher foto
                    <input
                      id="profile-photo-file"
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        uploadProfilePhoto(event.target.files?.[0])
                      }
                    />
                  </label>
                  {form.fotoUrl ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={removeProfilePhoto}
                      disabled={profilePhotoBusy}
                    >
                      Remover foto
                    </button>
                  ) : null}
                </div>
                <span className="text-xs font-normal leading-5 text-slate-500">
                  JPG, PNG ou WebP de até 8 MB. A foto será armazenada com
                  segurança no Vambora.
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
