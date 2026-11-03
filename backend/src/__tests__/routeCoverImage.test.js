import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../config/prisma.js", () => ({ prisma: {} }));
const route = {
  id: "r1",
  usuarioId: "u1",
  titulo: "Lisboa",
  destino: "Lisboa",
  imagemUrl: "https://res.cloudinary.com/test/image/upload/routes/old.webp",
  publico: false,
};
const criarNovoRoteiro = jest.fn();
const obterRoteiroPorId = jest.fn();
const atualizarRoteiro = jest.fn();
const excluirRoteiro = jest.fn();
jest.unstable_mockModule("../models/roteiro.model.js", () => ({
  criarNovoRoteiro,
  obterRoteiroPorId,
  atualizarRoteiro,
  excluirRoteiro,
}));
const imagemAindaReferenciada = jest.fn();
jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  imagemAindaReferenciada,
}));
const uploadImage = jest.fn(
  async ({ key }) => `https://res.cloudinary.com/test/image/upload/${key}`,
);
const deleteManagedImage = jest.fn().mockResolvedValue(true);
jest.unstable_mockModule("../config/storage.js", () => ({
  isManagedImageUrl: jest.fn(() => false),
  managedObjectKey: jest.fn((_prefix, extension) => `routes/new.${extension}`),
  uploadImage,
  deleteManagedImage,
}));
const auth = (req, _res, next) => {
  req.user = { id: "u1", role: "USER" };
  next();
};
jest.unstable_mockModule("../middlewares/authMiddleware.js", () => ({
  default: auth,
  optionalAuth: auth,
}));
const { default: app } = await import("../app.js");
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

describe("route cover image upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    criarNovoRoteiro.mockResolvedValue({ ...route, imagemUrl: null });
    obterRoteiroPorId.mockResolvedValue({ ...route });
    atualizarRoteiro.mockImplementation(async (_id, data) => ({
      ...route,
      ...data,
    }));
    imagemAindaReferenciada.mockResolvedValue(false);
    uploadImage.mockImplementation(
      async ({ key }) => `https://res.cloudinary.com/test/image/upload/${key}`,
    );
  });

  it("uploads a cover while creating a route and stores the returned URL", async () => {
    const response = await request(app)
      .post("/roteiros")
      .field("usuarioId", "u1")
      .field("titulo", "Lisboa")
      .field("destino", "Lisboa")
      .field("publico", "false")
      .attach("imagem", jpeg, {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(201);
    expect(criarNovoRoteiro).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "u1",
        imagemUrl:
          "https://res.cloudinary.com/test/image/upload/routes/new.jpg",
        publico: false,
      }),
    );
    expect(uploadImage).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "image/jpeg" }),
    );
  });

  it("replaces a managed cover and deletes the old asset only when unreferenced", async () => {
    const response = await request(app)
      .patch("/roteiros/r1")
      .field("titulo", "Lisboa atualizado")
      .attach("imagem", jpeg, {
        filename: "new-cover.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(200);
    expect(atualizarRoteiro).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({
        imagemUrl:
          "https://res.cloudinary.com/test/image/upload/routes/new.jpg",
      }),
    );
    expect(deleteManagedImage).toHaveBeenCalledWith(route.imagemUrl);
  });

  it("does not delete an old cover still referenced by another record", async () => {
    imagemAindaReferenciada.mockResolvedValue(true);
    const response = await request(app)
      .patch("/roteiros/r1")
      .attach("imagem", jpeg, {
        filename: "new-cover.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(200);
    expect(deleteManagedImage).not.toHaveBeenCalled();
  });

  it("passes an old external URL to the guarded storage adapter", async () => {
    obterRoteiroPorId.mockResolvedValue({
      ...route,
      imagemUrl: "https://images.example.test/cover.jpg",
    });
    const response = await request(app)
      .patch("/roteiros/r1")
      .attach("imagem", jpeg, {
        filename: "new-cover.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(200);
    expect(deleteManagedImage).toHaveBeenCalledWith(
      "https://images.example.test/cover.jpg",
    );
  });
});
