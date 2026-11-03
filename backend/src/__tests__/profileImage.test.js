import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../config/prisma.js", () => ({ prisma: {} }));
let fotoUrl = "https://media.example.test/profiles/old.webp";
const obterUsuarioComFoto = jest.fn(async (id) => ({ id, fotoUrl }));
const atualizarFotoPerfil = jest.fn(async (id, previousUrl, nextUrl) => {
  if (fotoUrl !== previousUrl) return null;
  fotoUrl = nextUrl;
  return { id, nome: "Viajante", fotoUrl };
});
jest.unstable_mockModule("../models/users.model.js", () => ({
  obterUsuarioComFoto,
  atualizarFotoPerfil,
}));
jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  imagemAindaReferenciada: jest.fn().mockResolvedValue(false),
}));
jest.unstable_mockModule("../models/roteiro.model.js", () => ({}));
const deleteManagedImage = jest.fn().mockResolvedValue(true);
jest.unstable_mockModule("../config/storage.js", () => ({
  managedObjectKey: jest.fn((prefix, extension) => `${prefix}new.${extension}`),
  uploadImage: jest.fn(async ({ key }) => `https://media.example.test/${key}`),
  deleteManagedImage,
}));
const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization)
    return res.status(401).json({ message: "Token não informado" });
  req.user = { id: "u1", role: "USER" };
  next();
};
jest.unstable_mockModule("../middlewares/authMiddleware.js", () => ({
  default: authMiddleware,
  optionalAuth: authMiddleware,
}));
const { default: app } = await import("../app.js");

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

describe("profile image routes", () => {
  beforeEach(() => {
    fotoUrl = "https://media.example.test/profiles/old.webp";
    deleteManagedImage.mockClear();
    atualizarFotoPerfil.mockClear();
  });

  it("requires authentication before accepting a profile image", async () => {
    const response = await request(app)
      .post("/usuarios/me/foto")
      .attach("foto", jpeg, {
        filename: "avatar.jpg",
        contentType: "image/jpeg",
      });
    expect(response.status).toBe(401);
  });

  it("uploads a replacement, updates only the authenticated user, then removes the old managed object", async () => {
    const response = await request(app)
      .post("/usuarios/me/foto")
      .set("Authorization", "Bearer test")
      .attach("foto", jpeg, {
        filename: "avatar.jpg",
        contentType: "image/jpeg",
      });
    expect(response.status).toBe(200);
    expect(response.body.usuario.fotoUrl).toBe(
      "https://media.example.test/profiles/new.jpg",
    );
    expect(atualizarFotoPerfil).toHaveBeenCalledWith(
      "u1",
      "https://media.example.test/profiles/old.webp",
      "https://media.example.test/profiles/new.jpg",
    );
    expect(deleteManagedImage).toHaveBeenCalledWith(
      "https://media.example.test/profiles/old.webp",
    );
  });

  it("keeps the previous file when a concurrent replacement wins first", async () => {
    atualizarFotoPerfil.mockResolvedValueOnce(null);
    const response = await request(app)
      .post("/usuarios/me/foto")
      .set("Authorization", "Bearer test")
      .attach("foto", jpeg, {
        filename: "avatar.jpg",
        contentType: "image/jpeg",
      });
    expect(response.status).toBe(409);
    expect(deleteManagedImage).toHaveBeenCalledTimes(1);
    expect(deleteManagedImage).toHaveBeenCalledWith(
      "https://media.example.test/profiles/new.jpg",
    );
  });

  it("clears the database reference before requesting removal of the managed image", async () => {
    const response = await request(app)
      .delete("/usuarios/me/foto")
      .set("Authorization", "Bearer test");
    expect(response.status).toBe(200);
    expect(response.body.usuario.fotoUrl).toBeNull();
    expect(atualizarFotoPerfil).toHaveBeenCalledWith(
      "u1",
      "https://media.example.test/profiles/old.webp",
      null,
    );
    expect(deleteManagedImage).toHaveBeenCalledWith(
      "https://media.example.test/profiles/old.webp",
    );
  });
});
