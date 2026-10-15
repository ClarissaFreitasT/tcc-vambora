export function formatCommunityDate(value) {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function filterTravelers(travelers, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalizedQuery) return travelers;

  return travelers.filter((traveler) =>
    [traveler.nome, traveler.username, traveler.bio]
      .filter(Boolean)
      .some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      ),
  );
}

export function updatePostLike(posts, postId, liked, totalLikes) {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          curtiu: liked,
          _count: { ...post._count, curtidas: totalLikes },
        }
      : post,
  );
}
