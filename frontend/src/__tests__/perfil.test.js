import { describe, expect, it } from "@jest/globals";
import {
  buildProfileUpdatePayload,
  validateProfilePhotoUrl,
} from "../utils/profile.js";

describe("profile form payload", () => {
  it("trims editable fields and omits a blank username", () => {
    expect(
      buildProfileUpdatePayload({
        nome: "  Ana Costa ",
        username: "   ",
        bio: "  Viajante  ",
        fotoUrl: " https://images.example.com/ana.jpg ",
      }),
    ).toEqual({
      nome: "Ana Costa",
      bio: "Viajante",
      fotoUrl: "https://images.example.com/ana.jpg",
    });
  });

  it("keeps a configured username and clears an empty photo URL", () => {
    expect(
      buildProfileUpdatePayload({
        nome: "Ana",
        username: " ana.costa ",
        bio: "",
        fotoUrl: "  ",
      }),
    ).toEqual({
      nome: "Ana",
      username: "ana.costa",
      bio: "",
      fotoUrl: null,
    });
  });

  it("validates photo links before the profile update request", () => {
    expect(
      validateProfilePhotoUrl("https://example.com/avatar.webp"),
    ).toBeNull();
    expect(validateProfilePhotoUrl("file:///photo.jpg")).toContain("http://");
    expect(
      validateProfilePhotoUrl(`https://e.test/${"x".repeat(250)}`),
    ).toContain("255");
  });
});
