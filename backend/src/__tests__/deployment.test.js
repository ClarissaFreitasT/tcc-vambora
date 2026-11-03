import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { databaseConfig } from "../config/database.js";

jest.unstable_mockModule("../config/prisma.js", () => ({ prisma: {} }));
const createPost = jest.fn().mockResolvedValue({ id: "p1", texto: "Viagem" });
let uploadCounter = 0;
const deleteManagedImage = jest.fn().mockResolvedValue(true);
jest.unstable_mockModule("../config/storage.js", () => ({
  isManagedImageUrl: jest.fn(() => false),
  managedObjectKey: jest.fn(
    (prefix, extension) => `${prefix}mock-${++uploadCounter}.${extension}`,
  ),
  uploadImage: jest.fn(async ({ key }) => `https://media.example.test/${key}`),
  deleteManagedImage,
}));
jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  criarPublicacao: createPost,
  listarCategoriasPublicacao: jest.fn().mockResolvedValue([]),
  imagemAindaReferenciada: jest.fn().mockResolvedValue(false),
}));
const authenticated = (req, _res, next) => {
  req.user = { id: "u1", role: "USER" };
  next();
};
jest.unstable_mockModule("../middlewares/authMiddleware.js", () => ({
  default: authenticated,
  optionalAuth: authenticated,
}));
const { default: app } = await import("../app.js");

describe("deploy", () => {
  it("mantém publicações JSON sem fotos", async () => {
    const response = await request(app)
      .post("/publicacoes")
      .send({ texto: "Viagem", categoriaIds: [] });
    expect(response.status).toBe(201);
    expect(createPost).toHaveBeenCalledWith("u1", "Viagem", null, [], []);
  });

  it("recusa arquivo inválido sem criar publicação", async () => {
    createPost.mockClear();
    const response = await request(app)
      .post("/publicacoes")
      .field("texto", "Viagem")
      .attach("fotos", Buffer.from("arquivo de teste"), "foto.png");
    expect(response.status).toBe(400);
    expect(createPost).not.toHaveBeenCalled();
  });

  it("recebe várias fotos válidas e preserva a ordem na criação", async () => {
    createPost.mockClear();
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const response = await request(app)
      .post("/publicacoes")
      .field("texto", "Viagem com fotos")
      .field("categoriaIds", "[]")
      .attach("fotos", jpeg, {
        filename: "primeira.jpg",
        contentType: "image/jpeg",
      })
      .attach("fotos", jpeg, {
        filename: "segunda.jpg",
        contentType: "image/jpeg",
      });
    expect(response.status).toBe(201);
    expect(createPost).toHaveBeenCalledWith(
      "u1",
      "Viagem com fotos",
      null,
      [
        "https://media.example.test/community/mock-1.jpg",
        "https://media.example.test/community/mock-2.jpg",
      ],
      [],
    );
  });

  it("remove os objetos enviados se a criação no banco falhar", async () => {
    uploadCounter = 0;
    deleteManagedImage.mockClear();
    createPost.mockRejectedValueOnce(new Error("falha simulada do banco"));
    const response = await request(app)
      .post("/publicacoes")
      .field("texto", "Falha de persistência")
      .field("categoriaIds", "[]")
      .attach("fotos", Buffer.from([0xff, 0xd8, 0xff, 0x00]), {
        filename: "foto.jpg",
        contentType: "image/jpeg",
      });
    expect(response.status).toBe(500);
    expect(deleteManagedImage).toHaveBeenCalledWith(
      "https://media.example.test/community/mock-1.jpg",
    );
  });

  it("health responde sem acessar banco", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("permite preflight com Authorization na origem local", async () => {
    const response = await request(app)
      .options("/roteiros")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");
    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(response.headers["access-control-allow-headers"]).toContain(
      "authorization",
    );
  });

  it("não libera CORS para outra origem", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "https://untrusted.invalid");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("usa a mesma URL do CLI, com porta e senha codificada, e verifica TLS", () => {
    expect(
      databaseConfig({
        DATABASE_URL:
          "mysql://app:p%40ss@db.invalid:3307/vambora?sslaccept=strict",
      }),
    ).toMatchObject({
      host: "db.invalid",
      port: 3307,
      user: "app",
      password: "p@ss",
      database: "vambora",
      ssl: { rejectUnauthorized: true },
    });
  });

  it("rejeita configuração ausente e TLS inseguro sem expor credenciais", () => {
    expect(() => databaseConfig({})).toThrow("Configure DATABASE_URL");
    expect(() =>
      databaseConfig({
        DATABASE_URL:
          "mysql://app:unused@db.invalid/vambora?sslaccept=accept_invalid_certs",
      }),
    ).toThrow("sslaccept=strict");
  });
});
