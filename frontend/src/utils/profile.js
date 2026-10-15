export function profilePath(profile) {
  if (!profile) return null;
  if (profile.username)
    return `/perfil/${encodeURIComponent(profile.username)}`;
  if (profile.id) return `/perfil/id/${encodeURIComponent(profile.id)}`;
  return null;
}

export function validateProfilePhotoUrl(value) {
  const url = value.trim();
  if (!url) return null;
  if (url.length > 255)
    return "O link da imagem deve ter no máximo 255 caracteres.";

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return "Use um link de imagem iniciado por http:// ou https://.";
    }
  } catch {
    return "Informe um link direto e válido para a imagem.";
  }

  return null;
}

export function buildProfileUpdatePayload(form) {
  const payload = {
    nome: form.nome.trim(),
    bio: form.bio.trim(),
    fotoUrl: form.fotoUrl.trim() || null,
  };
  if (form.username.trim()) payload.username = form.username.trim();
  return payload;
}
