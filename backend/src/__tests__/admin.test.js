import request from "supertest";
import { jest } from "@jest/globals";

const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockVerify = jest.fn();
const mockSign = jest.fn();
const mockHash = jest.fn();
const mockCompare = jest.fn();

const mockPrisma = {
  usuario: {
    findUnique: mockFindUnique,
    findMany: mockFindMany,
    create: mockCreate,
    update: mockUpdate,
  },
};

jest.unstable_mockModule("../config/prisma.js", () => ({ prisma: mockPrisma }));
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: mockVerify, sign: mockSign },
}));
jest.unstable_mockModule("bcrypt", () => ({
  default: { hash: mockHash, compare: mockCompare },
}));

const { default: app } = await import("../app.js");

describe("Autorização de administrador", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockImplementation((token) => ({ id: token }));
  });

  it("retorna 401 em GET /usuarios sem token", async () => {
    const response = await request(app).get("/usuarios");

    expect(response.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("retorna 403 em GET /usuarios para usuário comum", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-token",
      nome: "Usuário comum",
      email: "user@example.com",
      role: "USER",
    });

    const response = await request(app)
      .get("/usuarios")
      .set("Authorization", "Bearer user-token");

    expect(response.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("retorna 200 para admin sem incluir senhaHash", async () => {
    mockFindUnique.mockResolvedValue({
      id: "admin-token",
      nome: "Admin",
      email: "admin@example.com",
      role: "ADMIN",
    });
    mockFindMany.mockResolvedValue([
      {
        id: "user-1",
        nome: "Usuário comum",
        email: "user@example.com",
        role: "USER",
      },
    ]);

    const response = await request(app)
      .get("/usuarios")
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).not.toHaveProperty("senhaHash");
    const selectedFields = mockFindMany.mock.calls[0][0].select;
    expect(selectedFields).toEqual(
      expect.objectContaining({ id: true, role: true }),
    );
    expect(selectedFields).not.toHaveProperty("senhaHash");
  });

  it("não permite escolher ADMIN durante o cadastro", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockHash.mockResolvedValue("senha-hash");
    mockCreate.mockResolvedValue({
      id: "new-user",
      nome: "Novo usuário",
      email: "novo@example.com",
      senhaHash: "senha-hash",
      role: "USER",
    });

    const response = await request(app).post("/auth/register").send({
      nome: "Novo usuário",
      email: "novo@example.com",
      password: "senha123",
      role: "ADMIN",
    });

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        nome: "Novo usuário",
        email: "novo@example.com",
        senhaHash: "senha-hash",
      },
    });
    expect(response.body.usuario).not.toHaveProperty("senhaHash");
  });

  it("não permite promover uma conta por PATCH /usuarios/:id", async () => {
    mockFindUnique
      .mockResolvedValueOnce({
        id: "user-token",
        nome: "Usuário comum",
        email: "user@example.com",
        role: "USER",
      })
      .mockResolvedValueOnce({ id: "user-token" });
    mockUpdate.mockResolvedValue({
      id: "user-token",
      nome: "Usuário comum",
      email: "user@example.com",
      role: "USER",
    });

    const response = await request(app)
      .patch("/usuarios/user-token")
      .set("Authorization", "Bearer user-token")
      .send({ role: "ADMIN" });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: {} }),
    );
    expect(response.body.usuario).not.toHaveProperty("senhaHash");
  });

  it("mantém login funcionando para uma conta USER", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      nome: "Usuário comum",
      email: "user@example.com",
      senhaHash: "senha-hash",
      role: "USER",
    });
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue("jwt-user");

    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "senha123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("jwt-user");
    expect(response.body.usuario).not.toHaveProperty("senhaHash");
  });

  it("mantém login funcionando para uma conta ADMIN", async () => {
    mockFindUnique.mockResolvedValue({
      id: "admin-1",
      nome: "Admin",
      email: "admin@example.com",
      senhaHash: "senha-hash",
      role: "ADMIN",
    });
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue("jwt-admin");

    const response = await request(app).post("/auth/login").send({
      email: "admin@example.com",
      password: "senha123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("jwt-admin");
    expect(response.body.usuario).not.toHaveProperty("senhaHash");
  });
});
