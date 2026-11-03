import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

const usuario = {
  id: "u1",
  nome: "Viajante",
  email: "viagem@example.test",
  senhaHash: "hash",
  fotoUrl: "https://res.cloudinary.com/demo/image/upload/profiles/avatar.webp",
};

jest.unstable_mockModule("../config/prisma.js", () => ({
  prisma: { usuario: { findUnique: jest.fn().mockResolvedValue(usuario) } },
}));
jest.unstable_mockModule("bcrypt", () => ({
  default: { compare: jest.fn().mockResolvedValue(true), hash: jest.fn() },
}));
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { sign: jest.fn(() => "test-token"), verify: jest.fn() },
}));
const { default: app } = await import("../app.js");

describe("login profile photo", () => {
  it("returns the persisted profile photo with the authenticated session user", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: usuario.email, password: "password" });

    expect(response.status).toBe(200);
    expect(response.body.usuario).toMatchObject({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      fotoUrl: usuario.fotoUrl,
    });
  });
});
