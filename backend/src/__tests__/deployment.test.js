import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { databaseConfig } from "../config/database.js";

jest.unstable_mockModule("../config/prisma.js", () => ({ prisma: {} }));
const createPost = jest.fn().mockResolvedValue({ id: "p1", texto: "Viagem" });
jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  criarPublicacao: createPost,
  listarCategoriasPublicacao: jest.fn().mockResolvedValue([]),
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
    const response = await request(app).post("/publicacoes")
      .send({ texto: "Viagem", categoriaIds: [] });
    expect(response.status).toBe(201);
    expect(createPost).toHaveBeenCalledWith("u1", "Viagem", null, [], []);
  });

  it("recusa upload multipart sem criar publicação", async () => {
    createPost.mockClear();
    const response = await request(app).post("/publicacoes")
      .field("texto", "Viagem")
      .attach("fotos", Buffer.from("arquivo de teste"), "foto.png");
    expect(response.status).toBe(415);
    expect(createPost).not.toHaveBeenCalled();
  });

  it("health responde sem acessar banco", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("permite preflight com Authorization na origem local", async () => {
    const response = await request(app).options("/roteiros")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");
    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(response.headers["access-control-allow-headers"]).toContain("authorization");
  });

  it("não libera CORS para outra origem", async () => {
    const response = await request(app).get("/health").set("Origin", "https://untrusted.invalid");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("usa a mesma URL do CLI, com porta e senha codificada, e verifica TLS", () => {
    expect(databaseConfig({
      DATABASE_URL: "mysql://app:p%40ss@db.invalid:3307/vambora?sslaccept=strict",
    })).toMatchObject({
      host: "db.invalid", port: 3307, user: "app", password: "p@ss",
      database: "vambora", ssl: { rejectUnauthorized: true },
    });
  });

  it("rejeita configuração ausente e TLS inseguro sem expor credenciais", () => {
    expect(() => databaseConfig({})).toThrow("Configure DATABASE_URL");
    expect(() => databaseConfig({
      DATABASE_URL: "mysql://app:unused@db.invalid/vambora?sslaccept=accept_invalid_certs",
    })).toThrow("sslaccept=strict");
  });
});
