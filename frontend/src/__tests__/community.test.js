import { describe, expect, it } from "@jest/globals";
import {
  filterTravelers,
  formatCommunityDate,
  updatePostLike,
} from "../utils/community.js";
import { profilePath, validateProfilePhotoUrl } from "../utils/profile.js";

describe("community helpers", () => {
  it("filters travelers by name, username, or bio without case sensitivity", () => {
    const travelers = [
      { id: "1", nome: "Ana Costa", username: "anacosta", bio: "Trilhas" },
      { id: "2", nome: "Bruno Lima", username: "brunolima", bio: "Praias" },
    ];

    expect(filterTravelers(travelers, "  TRILHAS ")).toEqual([travelers[0]]);
    expect(filterTravelers(travelers, "BRUNO")).toEqual([travelers[1]]);
    expect(filterTravelers(travelers, "brunolima")).toEqual([travelers[1]]);
    expect(filterTravelers(travelers, " ")).toBe(travelers);
  });

  it("formats valid publication dates and uses a fallback for missing dates", () => {
    expect(formatCommunityDate(null)).toBe("Agora");
    expect(formatCommunityDate("not-a-date")).toBe("Agora");
    expect(formatCommunityDate("2026-10-15T12:30:00.000Z")).toContain("15");
  });

  it("updates the target post's like state and count immutably", () => {
    const posts = [
      { id: "p1", curtiu: false, _count: { curtidas: 3, comentarios: 2 } },
      { id: "p2", curtiu: false, _count: { curtidas: 1, comentarios: 0 } },
    ];

    const updated = updatePostLike(posts, "p1", true, 4);

    expect(updated).toEqual([
      { id: "p1", curtiu: true, _count: { curtidas: 4, comentarios: 2 } },
      posts[1],
    ]);
    expect(posts[0].curtiu).toBe(false);
  });

  it("preserves the other post counters while changing likes", () => {
    const [updated] = updatePostLike(
      [{ id: "p1", _count: { curtidas: 1, comentarios: 6 } }],
      "p1",
      true,
      2,
    );

    expect(updated._count).toEqual({ curtidas: 2, comentarios: 6 });
  });

  it("creates a profile link by username or falls back to the user ID", () => {
    expect(profilePath({ id: "u1", username: "ana costa" })).toBe(
      "/perfil/ana%20costa",
    );
    expect(profilePath({ id: "u2", username: null })).toBe("/perfil/id/u2");
    expect(profilePath(null)).toBeNull();
  });

  it("accepts only http image URLs that fit the profile photo field", () => {
    expect(validateProfilePhotoUrl("")).toBeNull();
    expect(
      validateProfilePhotoUrl(" https://images.example.com/photo.jpg "),
    ).toBeNull();
    expect(validateProfilePhotoUrl("C:\\Users\\me\\photo.jpg")).toContain(
      "http://",
    );
    expect(validateProfilePhotoUrl("data:image/png;base64,abc")).toContain(
      "http://",
    );
    expect(
      validateProfilePhotoUrl(`https://example.com/${"a".repeat(250)}`),
    ).toContain("255");
  });
});
